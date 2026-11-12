/* AnimeSchedule's public RSS feed adapter. It imports schedule entries and original links only; it does not extract video streams. */
(function(root){
  'use strict';
  root.createAnimeScheduleRSSAdapter=function({fetchItems,parseText}){
    if(typeof fetchItems!=='function'||typeof parseText!=='function')throw new TypeError('AnimeSchedule RSS needs the shared fetchItems and parseText functions.');
    const validUrl=value=>{try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:''}catch(_){return ''}};
    return Object.freeze({
      id:'animeschedule-rss',
      capabilities:Object.freeze({
        metadata:true,
        scheduleEntries:true,
        sourceLinks:true,
        directVideo:false,
        playbackFallback:'original-source-page',
        attribution:'AnimeSchedule'
      }),
      matches(source){
        if(!source)return false;
        if(source.adapterId==='animeschedule-rss')return true;
        try{
          const url=new URL(String(source.url||''));
          return url.hostname==='animeschedule.net'&&/^\/(?:sub|dub|jpn)rss\.xml$/i.test(url.pathname);
        }catch(_){return false}
      },
      load(source){
        return source.raw!=null?parseText(source.raw):fetchItems(source);
      },
      resolve(record){
        const video=validUrl(record&&record.video),link=validUrl(record&&record.link);
        if(video)return{type:'media',src:video,fallbackUrl:link,attribution:record.src||'AnimeSchedule'};
        if(link)return{type:'page',src:link,attribution:record.src||'AnimeSchedule'};
        return null;
      }
    });
  };
})(window);
