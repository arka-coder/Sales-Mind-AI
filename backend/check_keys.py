import sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

env = {}
with open('.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

results = {}

# GROQ
try:
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/models',
        headers={'Authorization': 'Bearer ' + env.get('GROQ_API_KEY', '')}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        results['GROQ'] = 'OK  Working'
except urllib.error.HTTPError as e:
    results['GROQ'] = 'FAIL HTTP ' + str(e.code) + ' ' + e.reason
except Exception as e:
    results['GROQ'] = 'FAIL ' + str(e)

# OPENAI
try:
    req = urllib.request.Request(
        'https://api.openai.com/v1/models',
        headers={'Authorization': 'Bearer ' + env.get('OPENAI_API_KEY', '')}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        results['OPENAI'] = 'OK  Working'
except urllib.error.HTTPError as e:
    results['OPENAI'] = 'FAIL HTTP ' + str(e.code) + ' ' + e.reason
except Exception as e:
    results['OPENAI'] = 'FAIL ' + str(e)

# ELEVENLABS
try:
    req = urllib.request.Request(
        'https://api.elevenlabs.io/v1/user',
        headers={'xi-api-key': env.get('ELEVENLABS_API_KEY', '')}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        results['ELEVENLABS'] = 'OK  Working'
except urllib.error.HTTPError as e:
    results['ELEVENLABS'] = 'FAIL HTTP ' + str(e.code) + ' ' + e.reason
except Exception as e:
    results['ELEVENLABS'] = 'FAIL ' + str(e)

# SUPABASE
try:
    url = env.get('SUPABASE_URL', '').rstrip('/') + '/rest/v1/'
    anon = env.get('SUPABASE_ANON_KEY', '')
    req = urllib.request.Request(
        url,
        headers={'apikey': anon, 'Authorization': 'Bearer ' + anon}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        results['SUPABASE'] = 'OK  Working'
except urllib.error.HTTPError as e:
    results['SUPABASE'] = 'FAIL HTTP ' + str(e.code) + ' ' + e.reason
except Exception as e:
    results['SUPABASE'] = 'FAIL ' + str(e)[:80]

# RESEND
try:
    payload = json.dumps({'from': 'test@resend.dev', 'to': ['delivered@resend.dev'], 'subject': 'test', 'html': 'test'}).encode()
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={'Authorization': 'Bearer ' + env.get('RESEND_API_KEY', ''), 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        results['RESEND'] = 'OK  Working'
except urllib.error.HTTPError as e:
    body = e.read().decode()[:100]
    results['RESEND'] = 'FAIL HTTP ' + str(e.code) + ' ' + body
except Exception as e:
    results['RESEND'] = 'FAIL ' + str(e)

print()
print('=' * 56)
print('       API KEY STATUS CHECK')
print('=' * 56)
for k, v in results.items():
    tag = '[OK ]' if v.startswith('OK') else '[ERR]'
    print('  ' + tag + ' ' + k.ljust(15) + ' ' + v)
print('=' * 56)
print('  GROQ key:     ' + env.get('GROQ_API_KEY', 'MISSING')[:24] + '...')
print('  Supabase URL: ' + env.get('SUPABASE_URL', 'MISSING'))
print('  Resend key:   ' + env.get('RESEND_API_KEY', 'MISSING')[:20] + '...')
print('=' * 56)
