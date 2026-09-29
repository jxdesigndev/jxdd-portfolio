export function attach(universe) {
  universe.loadTools = async function() {
    const containers = document.querySelectorAll('.db-tools-container');
    if (!containers.length) return;

    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn('JX: Supabase init failed (tools)', err);
    }
    if (typeof supabase === 'undefined' || !supabase.from) return;

    try {
      const { data: tools, error } = await supabase
        .from('tools')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      let totalRenderedTools = 0;

      containers.forEach(container => {
        const category = container.getAttribute('data-tool-category');
        let filteredTools = tools;

        if (category && category !== 'all') {
          const cats = category.split(',').map(c => c.trim().toLowerCase());
          filteredTools = tools.filter(t => {
            const dbCat = (t.category || '').toLowerCase();
            return cats.some(c => dbCat.includes(c));
          });
        }

        if (filteredTools.length === 0) {
          // Hide specific empty category
          const group = container.closest('.tools-group') || container.closest('.bento-item') || container;
          group.style.display = 'none';
          return;
        }

        totalRenderedTools += filteredTools.length;

        const group = container.closest('.tools-group') || container.closest('.bento-item');
        if (group) group.style.display = '';

        container.innerHTML = '';
        const newNodes = [];

        filteredTools.forEach(tool => {
          const item = document.createElement('div');
          item.className = 'tool-item';

          if (tool.logo_url) {
            const img = document.createElement('img');
            img.src    = tool.logo_url;
            img.alt    = tool.name;
            img.title  = tool.name;
            img.width  = 48;
            img.height = 48;
            
            item.appendChild(img);
          } else {
            const label = document.createElement('span');
            label.className   = 'tool-item-name';
            label.textContent = tool.name;
            item.appendChild(label);
          }

          container.appendChild(item);
          newNodes.push(item);
        });
        
        // Store nodes for physics init later
        container._physicsNodes = newNodes;
      }); // end first loop

      const globalSection = document.getElementById('tools-section');
      if (globalSection) {
        if (totalRenderedTools > 0) {
          globalSection.style.display = 'block'; // MUST BE BLOCK BEFORE PHYSICS
        } else {
          globalSection.style.display = 'none';
        }
      }

      // Loop 2: Init premium grid and spotlight interactions
      containers.forEach(container => {
        const newNodes = container._physicsNodes || [];
        if (newNodes.length === 0) return;

        // CSS-native stagger reveal — items are visible by default,
        // animation class enhances appearance but is not required for visibility
        newNodes.forEach((el, index) => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.margin = '';
            // Start transparent for stagger, but with a guaranteed fallback
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px) scale(0.95)';
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';
            }, 80 + index * 55); // 80ms base delay + stagger
        });
      });

    } catch (err) {
      console.error('JX: Tools load error:', err);
      containers.forEach(c => {
        const section = c.closest('.tools-section') || c;
        section.style.display = 'none';
      });
    }
  };

}
