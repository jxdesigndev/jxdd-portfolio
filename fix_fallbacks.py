for js_file in ['script.js', 'work.js', 'project.js']:
    with open(js_file, 'r') as f:
        content = f.read()
    
    # Simple string replacements instead of regex
    target_p_desc = ": (p.description || '').replace(/<[^>]*>?/gm, '')"
    new_p_desc = ": (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(p.description || '', 'text/html').body.textContent || ''; return d.innerHTML; })()"
    
    target_p_cont = ": (p.content || '').replace(/<[^>]*>?/gm, '')"
    new_p_cont = ": (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(p.content || '', 'text/html').body.textContent || ''; return d.innerHTML; })()"
    
    target_proj_desc = ": project.description.replace(/<[^>]*>?/gm, '');"
    new_proj_desc = ": (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(project.description || '', 'text/html').body.textContent || ''; return d.innerHTML; })();"

    target_proj_out = ": project.outcome_text.replace(/<[^>]*>?/gm, '');"
    new_proj_out = ": (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(project.outcome_text || '', 'text/html').body.textContent || ''; return d.innerHTML; })();"

    content = content.replace(target_p_desc, new_p_desc)
    content = content.replace(target_p_cont, new_p_cont)
    content = content.replace(target_proj_desc, new_proj_desc)
    content = content.replace(target_proj_out, new_proj_out)

    with open(js_file, 'w') as f:
        f.write(content)
