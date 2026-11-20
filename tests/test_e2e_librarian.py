from pathlib import Path

def test_webapp_assets_exist():
    index_html = Path("web/index.html")
    assert index_html.exists()
    content = index_html.read_text(encoding="utf-8")
    assert "telegram-web-app.js" in content
    assert "Польша" in content or "Нидерланды" in content
    assert "Хранилище" in content or "Vault" in content

def test_webapp_css_and_js_exist():
    assert Path("web/style.css").exists()
    assert Path("web/app.js").exists()

def test_agents_doc_has_librarian():
    agents_md = Path("AGENTS.md").read_text(encoding="utf-8")
    assert "Библиотекарь" in agents_md or "Librarian" in agents_md or "3-Tier" in agents_md
