(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 992) {
        $(".navbar .dropdown")
          .on("mouseover", function () {
            $(".dropdown-toggle", this).trigger("click");
          })
          .on("mouseout", function () {
            $(".dropdown-toggle", this).trigger("click").blur();
          });
      } else {
        $(".navbar .dropdown").off("mouseover").off("mouseout");
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Vendor carousel
  $(".vendor-carousel").owlCarousel({
    loop: true,
    margin: 29,
    nav: false,
    autoplay: true,
    smartSpeed: 1000,
    responsive: {
      0: {
        items: 2,
      },
      576: {
        items: 3,
      },
      768: {
        items: 4,
      },
      992: {
        items: 5,
      },
      1200: {
        items: 6,
      },
    },
  });

  // Related carousel
  $(".related-carousel").owlCarousel({
    loop: false,
    margin: 20,
    nav: false,
    autoplay: true,
    smartSpeed: 1000,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
      },
      768: {
        items: 3,
      },
      992: {
        items: 4,
      },
    },
  });

  // Product Quantity
  $(".quantity button").on("click", function () {
    var button = $(this);
    var oldValue = button.parent().parent().find("input").val();
    if (button.hasClass("btn-plus")) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    button.parent().parent().find("input").val(newVal);
  });
})(jQuery);

/* HIDE/SHOW PASSWORD IN FORMS*/
let eyeIcon = document.getElementById("eyeIcon");
let pass = document.getElementById("form2Example2");

eyeIcon.onclick = function () {
  if (pass.type == "password") {
    pass.type = "text";
    eyeIcon.src = "../admin/assets/imgs/theme/eye-open.png";
  } else {
    pass.type = "password";
    eyeIcon.src = "../admin/assets/imgs/theme/eye-close.png";
  }
};

/*  USER REGISTRATION PAGE VALIDATION  */
var nameError = document.getElementById("name-error");
var emailError = document.getElementById("email-error");
var phoneError = document.getElementById("phone-error");
var passwordError = document.getElementById("pass-error");
var submitError = document.getElementById("submit-error");

function validateUserName() {
  var name = document.getElementById("username").value;
  if (name.length == 0) {
    nameError.style.color = "red";
    nameError.innerHTML = "Name is required";
    return false;
  }
  // if (!name.match(/^[A-Za-z].{3,}$/)) {
  //   nameError.innerHTML = "Minimum 4 character needed";
  //   return false;
  // }
  if (!name.match(/^[A-Za-z].{4,}$/)) {
    nameError.style.color = "red";
    nameError.innerHTML = "Minimum 5 characters needed";
    return false;
  }

  nameError.innerHTML = "valid";
  if ((nameError.innerHTML = "valid")) {
    nameError.style.color = "green";
  }
  return true;
}

function validateEmail() {
  var email = document.getElementById("email").value;
  if (email.length === 0) {
    emailError.style.color = "red";
    emailError.innerHTML = "Email is required";
    return false;
  } else if (!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
    emailError.style.color = "red";
    emailError.innerHTML = "Proper email format is required";
    return false;
  }
  emailError.innerHTML = "valid";
  if ((emailError.innerHTML = "valid")) {
    emailError.style.color = "green";
  }
  return true;
}

function validateMobile() {
  var mobile = document.getElementById("mobile").value;
  if (mobile.length == 0) {
    phoneError.style.color = "red";
    phoneError.innerHTML = "Mobile number is required";
    return false;
  } else if (!mobile.match(/^[0-9]{10}$/)) {
    phoneError.style.color = "red";
    phoneError.innerHTML = "Please enter only numbers";
    return false;
  } else if (mobile.length != 10) {
    phoneError.innerHTML = "Mobile number should be 10 digits";
    return false;
  }
  phoneError.innerHTML = "valid";
  if ((phoneError.innerHTML = "valid")) {
    phoneError.style.color = "green";
  }

  return true;
}

function validatePassword() {
  var password = document.getElementById("form2Example2").value;
  if (password.length == 0) {
    passwordError.style.color = "red";
    passwordError.innerHTML = "Password is required";
    return false;
  } else if (
    !password.match(/^(?=.*?[0-9])(?=.*?[a-z])(?=(.*?[^0-9A-Za-z]){2}).{8,32}$/)
  ) {
    passwordError.style.color = "red";
    passwordError.innerHTML =
      "Minimum 8 characters (alphanumeric + 2 special characters).";
    return false;
  }
  passwordError.innerHTML = "valid";
  if ((passwordError.innerHTML = "valid")) {
    passwordError.style.color = "green";
  } else {
    passwordError.style.color = "red";
  }
  return true;
}

function validateForm() {
  if (
    !validateUserName() ||
    !validateMobile() ||
    !validateEmail() ||
    !validatePassword()
  ) {
    submitError.style.display = "block";
    submitError.innerHTML = "All fields required";
    setTimeout(() => {
      submitError.style.display = "none";
    }, 2000);
    return false;
  }
}
