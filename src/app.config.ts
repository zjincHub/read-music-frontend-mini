export default defineAppConfig({
  pages: ["pages/chord/index", "pages/detail/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "和弦识别",
    navigationBarTextStyle: "black",
  },
  // tabBar: {
  //   color: "#999999",
  //   selectedColor: "#0064cf",
  //   backgroundColor: "#ffffff",
  //   borderStyle: "black",
  //   list: [
  //     {
  //       pagePath: "pages/chord/index",
  //       text: "和弦识别",
  //       iconPath: "./assets/icons/home.png",
  //       selectedIconPath: "./assets/icons/home-active.png",
  //     },
  //     {
  //       pagePath: "pages/chord/index",
  //       text: "和弦识别",
  //       iconPath: "./assets/icons/home.png",
  //       selectedIconPath: "./assets/icons/home-active.png",
  //     },
  //   ],
  // },
});
