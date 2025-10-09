# Building documentation: Mkdocs

## Prerequisits

* Python 3.13

## Development Server

Set up mkDocs with material theme:

```sh
# In project root
cd docs
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run development server

```sh
mkdocs serve
```