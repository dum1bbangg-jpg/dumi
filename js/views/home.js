window.DumiMounts = window.DumiMounts || {};
DumiMounts.home = function(root) {
  async function loadHome() {
    const { data } = await initSupabase().from('site_settings').select('key,value').in('key',['hero_name','tagline','channel_url']);
    const values = Object.fromEntries((data || []).map(row => [row.key,row.value]));
    if(values.hero_name) root.querySelectorById('home-heroName').textContent = values.hero_name;
    if(values.tagline) root.querySelectorById('home-tagline').textContent = values.tagline;
    if(values.channel_url) root.querySelectorById('home-channelBtn').href = values.channel_url;
  }
  return {start(){loadHome().catch(()=>{});}};
};
