const themeToggler = document.querySelector(".theme-toggler");

// change theme
themeToggler.addEventListener("click", () => {
    //document.body.classList.toggle("dark-theme-var");
    document.body.classList.toggle("disable-theme-var");
    //themeToggler.querySelector("span").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
})