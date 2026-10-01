import re

with open('admin.js', 'r') as f:
    content = f.read()

# Add DOM variables
old_dom = """    settingsForm: document.getElementById('settings-form'),"""
new_dom = """    settingsForm: document.getElementById('settings-form'),

    servicesTbody: document.getElementById('tbody-services'),
    btnNewService: document.getElementById('btn-new-service'),
    serviceModal: document.getElementById('service-modal-overlay'),
    serviceModalTitle: document.getElementById('service-modal-title'),
    serviceModalClose: document.getElementById('service-modal-close'),
    serviceForm: document.getElementById('service-form'),
    btnDeleteService: document.getElementById('btn-delete-service'),"""
content = content.replace(old_dom, new_dom)

with open('admin.js', 'w') as f:
    f.write(content)
