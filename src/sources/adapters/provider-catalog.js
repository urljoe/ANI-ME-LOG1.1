/* Catalog-only provider integrations. Provider-page links stay attributed to their site.
 * Uses the app's shared fetchText transport (direct request + configured proxy).
 * Does not extract, transform, or download media streams.
 */
(function(root){
  'use strict';

  const PROVIDERS={
    anikoto:{name:'AniKoto',host:'anikototv.to',path:'/'},
    animepahe:{name:'AnimePahe',host:'animepahe.ch',path:'/wp-json/wp/v2/posts?per_page=60&page=1&_fields=id,date_gmt,link,title'},
    aniworld:{name:'AniWorld',host:'aniworld.to',path:'/beliebte-animes'},
    kickassanime:{name:'KickAssAnime',host:'kaa.lt',path:'/popular'},
    anime4up:{name:'Anime4Up',host:'w1.anime4up.rest',path:'/%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D8%A7%D9%86%D9%85%D9%8A/'},
    animesama:{name:'Anime-Sama',host:'anime-sama.to',path:'/catalogue/'},
    latanime:{name:'Latanime',host:'latanime.org',path:'/animes'},
    mugiwara:{name:'Mugiwara',host:'www.mugiwara-no-streaming.com',path:'/catalogue'},
    justanime:{name:'JustAnime',host:'justanime.to',path:'/'},
    animeav1:{name:'AnimeAV1',host:'animeav1.com',path:'/'}
  };
  const validHttps=(value,base)=>{
    try{const u=new URL(value,base);return u.protocol==='https:'?u.href:''}catch(_){return ''}
  };
  const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#0*39;|&#x0*27;|&apos;/gi,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
  const key=s=>clean(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function item(title,link,image,extra={}){
    const cleanTitle=clean(title);
    const url=validHttps(link);
    if(cleanTitle.length<2||!url)return null;
    const img=validHttps(image,url);
    return {title:cleanTitle,raw:cleanTitle,link:url,image:img,aliases:[],...(extra||{})};
  }
  function rowsFromHtml(html,base,providerId){
    const doc=new DOMParser().parseFromString(String(html||''),'text/html'),out=[],seen=new Set();
    const anchors=[...doc.querySelectorAll('a[href]')];
    for(const a of anchors){
      const u=validHttps(a.getAttribute('href'),base);
      if(!u||new URL(u).hostname!==new URL(base).hostname)continue;
      const img=a.querySelector('img');
      if(!img)continue;
      const path=new URL(u).pathname;
      if(path==='/'||/\/(?:genre|category|tag|search|login|register|account|privacy|terms)(?:\/|$)/i.test(path))continue;
      let title=clean(a.querySelector('h1,h2,h3,h4,.title,.name,.anime-title,[title]')?.textContent||
        a.getAttribute('title')||img.getAttribute('alt')||'');
      if(!title||title.length<2)continue;
      if(providerId==='anikoto'){
        const match=path.match(/^\/watch\/([a-z0-9-]+)/i);
        if(!match)continue;
      }
      const image=img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||
        img.getAttribute('data-original')||img.getAttribute('src')||'';
      const record=item(title,u,image);
      if(!record)continue;
      const k=key(record.title)+'|'+record.link;
      if(seen.has(k))continue;
      seen.add(k);out.push(record);
      if(out.length>=80)break;
    }
    return out;
  }
  function fromAnimePahe(data){
    const out=[],seen=new Set();
    (Array.isArray(data)?data:[]).forEach(post=>{
      const raw=clean(post?.title?.rendered||post?.title||'');
      const m=raw.match(/^(.*?)\s+Episode\s+(\d+(?:\.\d+)?)\s+English\s+Subbed$/i);
      const link=validHttps(post?.link,'https://animepahe.ch/');
      if(!m||!link||new URL(link).hostname!=='animepahe.ch')return;
      const title=clean(m[1]),ep=String(Number(m[2])),k=key(title)+'|'+ep;
      if(seen.has(k))return;seen.add(k);
      out.push(item(title,link,'',{ep,date:Date.parse(post?.date_gmt||'')||0,sub:['SUB']}));
    });
    return out;
  }
  function fromJustAnime(data){
    const rootData=data&&typeof data==='object'?data:{};
    const lists=[rootData.trending,rootData.popular,rootData.airing,rootData.latestEpisode];
    const out=[],seen=new Set();
    lists.forEach(list=>(Array.isArray(list)?list:[]).forEach(x=>{
      const title=x?.title||x?.name,link=x?.url||x?.href||x?.link;
      const r=item(title,link,x?.image||x?.poster||x?.coverImage);
      if(!r)return;const k=key(r.title);if(seen.has(k))return;seen.add(k);out.push(r);
    }));
    return out.slice(0,80);
  }
  root.createProviderCatalogAdapter=function({fetchText}={}){
    if(typeof fetchText!=='function')throw new TypeError('Provider catalog needs the shared fetchText transport.');
    return Object.freeze({
      id:'provider-catalog',
      capabilities:Object.freeze({catalogue:true,episodes:'provider-page',sourceLinks:true,directVideo:false,playbackFallback:'original-source-page'}),
      matches(source){return !!source&&source.adapterId==='provider-catalog'&&!!PROVIDERS[source.providerId];},
      async load(source){
        const p=PROVIDERS[source&&source.providerId];
        if(!p)throw new Error('Unknown catalog provider.');
        const base=validHttps(source.url,'https://'+p.host+'/');
        if(!base||new URL(base).hostname!==p.host)throw new Error('Provider address must use its configured HTTPS host.');
        if(source.providerId==='animepahe'){
          const text=await fetchText(new URL(p.path,base).href);
          return fromAnimePahe(JSON.parse(text));
        }
        if(source.providerId==='justanime'){
          const text=await fetchText('https://core.justanime.to/api/home');
          return fromJustAnime(JSON.parse(text));
        }
        const catalogUrl=new URL(p.path,base).href;
        const html=await fetchText(catalogUrl);
        const records=rowsFromHtml(html,base,source.providerId);
        if(!records.length)throw new Error('No catalog titles were found. The provider page may have changed.');
        return records;
      },
      provider(id){return PROVIDERS[id]||null;}
    });
  };
})(window);
