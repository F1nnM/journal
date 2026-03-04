# --- Local Postgres ---
k8s_yaml('tilt/postgres.yaml')
k8s_resource('journal-postgres', labels=['infrastructure'], port_forwards=['5432:5432'])

# --- Helm Chart ---
watch_file('deploy/')
watch_file('tilt/')
_helm_yaml = local(
    'helm template journal deploy'
    + ' -f tilt/values.yaml'
    + ' -f tilt/values.dev.yaml',
    quiet=True,
)
k8s_yaml(_helm_yaml)
_rendered = decode_yaml_stream(_helm_yaml)

# --- Auto Image Builds (from Deployment container images matching local registry) ---
_registry_prefix = 'localhost:5050/journal'
for _r in _rendered:
    if _r.get('kind') == 'Deployment':
        for _c in _r.get('spec', {}).get('template', {}).get('spec', {}).get('containers', []):
            _image = _c.get('image', '')
            if _image.startswith(_registry_prefix):
                docker_build(
                    _image.rsplit(':', 1)[0],
                    context='.',
                    dockerfile='Dockerfile.dev',
                    live_update=[sync('.', '/app')],
                )

# --- Auto Port Forwards (from Service ports) ---
_service_ports = {}
for _r in _rendered:
    if _r.get('kind') == 'Service':
        _ports = [port_forward(p['port'], p['port'], host='0.0.0.0') for p in _r.get('spec', {}).get('ports', []) if p.get('port')]
        if _ports:
            _service_ports[_r['metadata']['name']] = _ports

for _r in _rendered:
    if _r.get('kind') == 'Deployment':
        _name = _r['metadata']['name']
        _opts = {'labels': ['app']}
        if _name in _service_ports:
            _opts['port_forwards'] = _service_ports[_name]
        k8s_resource(_name, **_opts)
