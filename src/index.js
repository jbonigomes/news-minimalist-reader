const KEY = 'news-minimalist'
const app = document.querySelector('section')
const getText = (item, tag) => item.getElementsByTagName(tag)[0].textContent
const sanitise = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const isSafeHref = (href) => {
    if (href) {
      const v = href.trim().toLowerCase()

      if (v.startsWith('javascript:') || v.startsWith('vbscript:')) {
        return false
      }

      try {
        const u = new URL(href, location.origin)
        return ['http:', 'https:', 'mailto:'].includes(u.protocol)
      } catch {
        return false
      }
    }

    return false
  }

  doc.body.querySelectorAll('*').forEach((el) => {
    if (el.tagName === 'A') {
      if (!isSafeHref(el.getAttribute('href'))) {
        el.removeAttribute('href')
      }

      [...el.attributes].forEach(({ name }) => {
        if (name !== 'href') {
          el.removeAttribute(name)
        }
      })
    }

    if (!['BR', 'A'].includes(el.tagName)) {
      el.replaceWith(...el.childNodes)
    }
  })

  return doc.body.innerHTML
}

app.addEventListener('toggle', ({ target }) => {
  const { id, open, tagName } = target

  if (open && tagName === 'DETAILS') {
    const data = JSON
      .parse(localStorage.getItem(KEY))
      .map((item) => ({ ...item, read: item.id === id ? true : item.read }))

    localStorage.setItem(KEY, JSON.stringify(data))
    target.querySelector('summary').classList.remove('unread')
  }
}, true)

const render = (items) => {
  app.innerHTML = items.map((item) => `
    <details name="feed" id="${item.id}">
      <summary class="${item.read ? '' : 'unread'}">${item.title}</summary>
      <p>
        <i>${item.date.split('T')[0].split('-').reverse().join('/')}</i>
        ${sanitise(item.content)}
      </p>
    </details>
  `).join('')
}

fetch('https://nameless-bread-889b.jbonigomes.workers.dev/')
  .then((response) => response.text())
  .then((text) => {
    const xml = new DOMParser().parseFromString(text, 'application/xml')
    const localItems = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const seen = new Set(localItems.map(({ id }) => id))

    const fetchedItems = [...xml.getElementsByTagName('item')]
      .map((item) => ({
        read: false,
        id: getText(item, 'guid'),
        title: getText(item, 'title'),
        content: getText(item, 'content:encoded'),
        date: new Date(getText(item, 'pubDate')).toJSON(),
      }))
      .filter(({ id }) => !seen.has(id))

    const allItems = [...fetchedItems, ...localItems]
      .toSorted((a, b) => (a.read - b.read) || b.date.localeCompare(a.date))
      .slice(0, 50)

    localStorage.setItem(KEY, JSON.stringify(allItems))
    render(allItems)
  })
