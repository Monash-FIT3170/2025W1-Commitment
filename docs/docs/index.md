{% set R = release if release is defined and release else {} %}
{% set D = downloads if downloads is defined and downloads else {'mac': [], 'win': [], 'linux': []} %}

# gitgauge

**Latest:** {{ R.version | default('') }} — {{ R.date | default('') }}{% if R.draft %} _(draft)_{% endif %}

Contribution analytics for modern classrooms & teams. Visualise commits, additions, deletions and branch activity.

[Open User Guide](guide/getting-started.md){ .md-button }
[See Latest Release]({{ R.notes_url | default('#') }}){ .md-button .md-button--primary }


## Downloads

=== "macOS"

{% if D.mac and D.mac | length > 0 %}
{% for item in D.mac %}
- **{{ item.label }}** — [Download]({{ item.url }}){% if item.checksum %} — `{{ item.checksum }}`{% endif %}
{% endfor %}
{% else %}
See assets on the latest release: {{ R.notes_url | default('#') }}
{% endif %}

=== "Windows"

{% if D.win and D.win | length > 0 %}
{% for item in D.win %}
- **{{ item.label }}** — [Download]({{ item.url }}){% if item.checksum %} — `{{ item.checksum }}`{% endif %}
{% endfor %}
{% else %}
See assets on the latest release: {{ R.notes_url | default('#') }}
{% endif %}

=== "Linux"

{% if D.linux and D.linux | length > 0 %}
{% for item in D.linux %}
- **{{ item.label }}** — [Download]({{ item.url }}){% if item.checksum %} — `{{ item.checksum }}`{% endif %}
{% endfor %}
{% else %}
See assets on the latest release: {{ R.notes_url | default('#') }}
{% endif %}

