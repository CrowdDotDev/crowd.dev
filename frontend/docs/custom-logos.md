# Step-by-step guide to add logos to custom platforms

This is a step-by-step guide to add logo images to custom platforms. Currently, we only render logo images for default integrations/platforms. For custom platforms we render fallback icons.

Platform logos are rendered in two formats, png/jpeg and svgs. Each format is used in different places of the UI, so there are two main components responsible to handle their display, `platform.vue` and `svg.vue`. For each new custom platform logo, the logo should be added in both formats.

The following steps provide a possible approach to add custom logos to custom platforms:

1. Inside `frontend/src/integrations` folder:

   1. Create a `/custom` folder to hold all custom platforms _if it's the first time adding a custom platform_.
   2. Each new custom platform folder should mirror the structure of the existing platforms. It should contain a `config.js` and a `index.js` file.
      1. `config.js` file should only contain 2 properties, `image`, and `name`.
      2. E.g. If we want to add a custom logo for `Luma` platform it would require:
         1. Folder structure: `src/integrations/custom/luma`
         2. File structure:
            1. `frontend/src/integrations/custom/luma/config.js`
            2. `frontend/src/integrations/custom/luma/index.js`
         3. Content of `config.js`:
            1. `image` can be a directory or a link.
         ```
            export default {
                name: 'Luma',
                image: '/images/integrations/custom/luma.png'
            };
         ```

2. Add the new images to the project:
   1. If you choose to add an image via a directory, add it to the `frontend/public/integrations/custom` folder. Create a`/custom` folder _if it's the first time adding a custom logo_.
   2. Support the svg logo by adding it to the `frontend/public/icons/crowd-icons.svg` file. E.g.:
      ```
      <symbol id="luma">
      	<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            ...
        </svg>
      </symbol>
      ```
      1. Add the `symbol` on the same level as the existing ones. Name the svg `symbol` with the key name of your platform. E.g. `id="luma"`
3. In `frontend/src/integrations/integrations-config.js` file you will need the following:

   1. Import the custom platform you just added:

   ```
   import luma from './custom/luma';
   ```

   2. Add `customIntegrations` method to the file. If it is already created, add the newly created platform to the object:

   ```
   get customIntegrations() {
       return {
           luma,
       };
   }
   ```

   3. Update `getConfig` method _if it's the first time adding custom platforms_:

   ```
   getConfig(platform) {
       if (this.integrations[platform]) {
           return this.integrations[platform];
       }

       return this.customIntegrations[platform];
   }
   ```

## Contributing

- [Guidelines](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md)
- Open a Pull Request to `crowd-linux` branch. Requires at least 1 approval before merging.
