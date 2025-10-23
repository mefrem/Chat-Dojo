module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@/components": "./src/components",
            "@/screens": "./src/screens",
            "@/services": "./src/services",
            "@/hooks": "./src/hooks",
            "@/contexts": "./src/contexts",
            "@/types": "./src/types",
            "@/utils": "./src/utils",
            "@/navigation": "./src/navigation",
          },
        },
      ],
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
