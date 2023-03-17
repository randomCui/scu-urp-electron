const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
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
