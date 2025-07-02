# 📖 How to Create a Storybook File for a UI-Kit Component

This guide explains how to create a Storybook file (`.stories.ts`) for a Vue component inside the **UI-Kit**. It includes examples and conventions to keep our documentation consistent and easy to maintain.

---

## 🛠️ Storybook Setup

Each component in the UI-Kit should have a corresponding Storybook file to:

✅ Document its usage  
✅ Define interactive examples  
✅ Showcase different states (e.g. with/without images, different sizes, etc.)

---

## 🗂️ Folder Structure

Inside `src/ui-kit/`, a typical component folder structure is:

```text
src/ui-kit/
└── <component-name>/
    ├── <ComponentName>.vue
    ├── <component-name>.scss
    ├── <ComponentName>.stories.ts
    └── ...
```

## ✍️ Example: Avatar.stories.ts

Below is an example Storybook file for the `Avatar` component:

```typescript
// Avatar.stories.ts
import LfAvatar from './Avatar.vue';

export default {
  title: 'LinuxFoundation/Avatar',  // Adjust path to match design system or team conventions
  component: LfAvatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: 'Specifies avatar size',
      defaultValue: 32,
      control: 'number',
    },
    name: {
      description: 'Name which translates to initials shown if no avatar',
      defaultValue: '',
      control: 'text',
    },
    src: {
      description: 'Avatar image URL',
      defaultValue: '',
      control: 'text',
    },
  },
};

export const Default = {
  args: {
    size: 96,
    name: 'John Doe',
    src: 'https://media.istockphoto.com/id/1318482009/photo/young-woman-ready-for-job-business-concept.jpg?s=612x612&w=0&k=20&c=Jc1NcoUMoM78AxPTh9EApaPU2kXh2evb499JgW99b0g=',
    id: 1,
  },
};

export const NoImage = {
  args: {
    size: 96,
    name: 'John Doe',
    src: '',
    id: 0,
  },
};
```

## 🔎 Explanation

Import the Component

```typescript

import LfAvatar from './Avatar.vue';

```
✅ **Define the Default Export**

This includes:

*   **title**: Follows the format ``DesignSystem/ComponentName``. Adjust it based on your design system structure (e.g. `LinuxFoundation/Button`, `LinuxFoundation/Avatar`).
    
*   **component**: The imported Vue component.
    
*   **tags**: Optional, e.g. `['autodocs']` for automatic documentation.
    
*   **argTypes**: An object defining the component’s props with:
    
    *   `description`: A short explanation of what the prop does.
        
    *   `defaultValue`: The default value for documentation.
        
    *   `control`: Specifies the control type for the Storybook UI (e.g. `'number'`, `'text'`, `'boolean'`).

✅ **Define Stories**

Use ``named exports`` (export const Default, export const NoImage, etc.) to define different variations of the component.

```typescript

export const Default = {
  args: {
    size: 96,
    name: 'John Doe',
    src: 'https://example.com/avatar.jpg',
  },
};

```

✅ **Use args**

`args` allows dynamic control of component props through the Storybook UI.


## ✏️ Creating a New Story

1️⃣ **Create a new** `<ComponentName>.stories.ts` in the component folder.

2️⃣ **Import the component.**

3️⃣ **Add `title`, `component`, and `argTypes` in the default export.**

4️⃣ **Create at least one story export** (like `Default`).



## 🔔 Best Practices

✅ Use consistent prop naming across components.

✅ Add helpful `description` values for each prop.

✅ Provide clear default values for props.

✅ Define at least one “default” story that shows a typical use case.

✅ Keep stories minimal but meaningful.