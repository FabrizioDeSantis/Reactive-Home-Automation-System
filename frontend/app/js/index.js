const themeToggler = document.querySelector(".theme-toggler");
const section = document.querySelector("section");
const closeBtn = document.querySelector(".close-btn");
// change theme
themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-var");
    //document.body.classList.toggle("disable-theme-var");
    //themeToggler.querySelector("span").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
    //section.classList.add("active");
});

closeBtn.addEventListener("click", () => {
    section.classList.remove("active");
});