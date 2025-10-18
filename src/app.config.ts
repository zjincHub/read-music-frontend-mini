export default defineAppConfig({
  pages: ["pages/divinate/index", "pages/record/index", "pages/result/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "虎虎半仙",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#999999",
    selectedColor: "#0064cf",
    backgroundColor: "#ffffff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/divinate/index",
        text: "首页",
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
