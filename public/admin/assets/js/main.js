!(function (e) {
  "use strict";
  if (
    (e(".menu-item.has-submenu .menu-link").on("click", function (s) {
      s.preventDefault(),
        e(this).next(".submenu").is(":hidden") &&
          e(this)
            .parent(".has-submenu")
            .siblings()
            .find(".submenu")
            .slideUp(200),
        e(this).next(".submenu").slideToggle(200);
    }),
    e("[data-trigger]").on("click", function (s) {
      s.preventDefault(), s.stopPropagation();
      var n = e(this).attr("data-trigger");
      e(n).toggleClass("show"),
        e("body").toggleClass("offcanvas-active"),
        e(".screen-overlay").toggleClass("show");
    }),
    e(".screen-overlay, .btn-close").click(function (s) {
      e(".screen-overlay").removeClass("show"),
        e(".mobile-offcanvas, .show").removeClass("show"),
        e("body").removeClass("offcanvas-active");
    }),
    e(".btn-aside-minimize").on("click", function () {
      window.innerWidth < 768
        ? (e("body").removeClass("aside-mini"),
          e(".screen-overlay").removeClass("show"),
          e(".navbar-aside").removeClass("show"),
          e("body").removeClass("offcanvas-active"))
        : e("body").toggleClass("aside-mini");
    }),
    e(".select-nice").length && e(".select-nice").select2(),
    e("#offcanvas_aside").length)
  ) {
    const e = document.querySelector("#offcanvas_aside");
    new PerfectScrollbar(e);
  }
  e(".darkmode").on("click", function () {
    e("body").toggleClass("dark");
  });
})(jQuery);

//** FOR DATE AND TIME IN ADMIN PAGES */
// document.write(new Date().getFullYear());

//** FOR FADING THE ERROR MESSAGE IN ADMIN PAGE */

setTimeout(() => {
  const fade = document.getElementById("errMsg");
  fade.style.display = "none";
}, 3000);

//** FOR HIDING PASSWORD IN ADMIN LOGIN PAGE */

let eyeIcon = document.getElementById("eyeIcon");
let pass = document.getElementById("pass");

eyeIcon.onclick = function (){
  if (pass.type == "password") {
    pass.type = "text";
    eyeIcon.src = "../admin/assets/imgs/theme/eye-open.png";
  } else {
    pass.type = "password";
    eyeIcon.src = "../admin/assets/imgs/theme/eye-close.png";
  }
};

// //**   SEARCHING DATA IN CATEGORY             */

// const searchCat = () => {
//   let filter = document.getElementById("searchCat").value.toUpperCase();
// };
