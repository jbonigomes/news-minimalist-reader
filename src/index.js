const KEY = 'news-minimalist'

const getText = (item, tag) => item.getElementsByTagName(tag)[0].textContent

const onClick = ({ target }) => {
  const allItems = JSON.parse(localStorage.getItem(KEY))

  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...allItems,
      [target.id]: {
        ...allItems[target.id],
        read: true,
      }
    })
  )

  target.getElementsByTagName('summary')[0].classList.remove('unread')
}

const render = (items) => {
  document.getElementsByTagName('section')[0].innerHTML = items.map((item) => `
    <details name="feed" id="${item.id}" ontoggle="onClick(event)">
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
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'application/xml')

    const localItems = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const fetchedItems = [...xmlDoc.getElementsByTagName('item')]
      .filter((item) => !localItems[getText(item, 'guid')])
      .reduce((acc, cur) => ({
        ...acc,
        [getText(cur, 'guid')]: {
          read: false,
          title: getText(cur, 'title'),
          content: getText(cur, 'content:encoded'),
          date: (new Date(getText(cur, 'pubDate'))).toJSON(),
        },
      }), {})

    const allItems = Object
      .entries({ ...fetchedItems, ...localItems })
      .map(([id, item]) => ({ id, ...item }))
      .toSorted((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50)

    const read = allItems.filter(({ read }) => read)
    const unread = allItems.filter(({ read }) => !read)

    localStorage.setItem(KEY, JSON.stringify(allItems.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})))

    render([...unread, ...read])
  })
