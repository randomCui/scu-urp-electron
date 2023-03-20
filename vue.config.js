const { defineConfig } = require("@vue/cli-service");
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack:{
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      // Or, for multiple preload files:
      // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' }
      builderOptions: {
        "appId": "com.example.app",
        "productName": "scu-urp-improved",
        "copyright": "Copyright © 2023",
        "win": {
          "target": [
            {
              target: "portable",
              arch: [
                "x64"
              ]
            }
          ]
        }
      }
    }
  }
});
