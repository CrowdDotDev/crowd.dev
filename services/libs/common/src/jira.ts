// Helper functions to create ADF nodes in Jira
export function createHeading(text: string, level = 3) {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  }
}

export function createParagraph(text: string, isUrl = false) {
  if (isUrl) {
    return {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '',
          marks: [
            {
              type: 'link',
              attrs: {
                href: text,
              },
            },
          ],
        },
      ],
    }
  }

  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  }
}
