export default defineAppConfig({
  pages: [
    "pages/chord/index",
    "pages/query/index",
    "pages/divinate/index",
    "pages/record/index",
    "pages/result/index",
    "pages/detail/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "和弦识别",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#999999",
    selectedColor: "#0064cf",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/query/index",
        text: "查卦",
        iconPath: "./assets/icons/home.png",
        selectedIconPath: "./assets/icons/home-active.png",
      },
      {
        pagePath: "pages/record/index",
        text: "我的",
        iconPath: "./assets/icons/mine.png",
        selectedIconPath: "./assets/icons/mine-active.png",
      },
    ],
  },
});
