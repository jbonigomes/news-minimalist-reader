const KEY = 'news-minimalist'

const getText = (item, tag) => item.getElementsByTagName(tag)[0].textContent

const onToggle = ({ currentTarget }) => {
  const { id, open } = currentTarget

  if (open) {
    const data = JSON
      .parse(localStorage.getItem(KEY))
      .map((item) => ({ ...item, read: item.id === id ? true : item.read }))

    localStorage.setItem(KEY, JSON.stringify(data))
    currentTarget.querySelector('summary').classList.remove('unread')
  }
}

const render = (items) => {
  document.querySelector('section').innerHTML = items.map((item) => `
    <details name="feed" id="${item.id}" ontoggle="onToggle(event)">
      <summary class="${item.read ? '' : 'unread'}">${item.title}</summary>
      <p>
        <i>${item.date.split('T')[0].split('-').reverse().join('/')}</i>
        ${item.content}
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
