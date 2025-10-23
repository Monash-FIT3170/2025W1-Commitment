{% set R = release if release is defined and release else {} %}
{% set D = downloads if downloads is defined and downloads else {'mac': [], 'win': [], 'linux': []} %}

# gitgauge

**Latest:** {{ R.version | default('') }} — {{ R.date | default('') }}{% if R.draft %} _(draft)_{% endif %}

Contribution analytics for modern classrooms & teams. Visualise commits, additions, deletions and branch activity.

[Open User Guide](guide/getting-started.md){ .md-button }
[See Latest Release]({{ R.notes_url | default('#') }}){ .md-button .md-button--primary }

## Downloads


{{ render_platform('macOS', R.version, R.date, R.notes_url, D.mac) }}

{{ render_platform('Windows', R.version, R.date, R.notes_url, D.win) }}

{{ render_platform('Linux', R.version, R.date, R.notes_url, D.linux) }}
