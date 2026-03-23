(function() {
    const token = localStorage.getItem("token"); // <--- DEBE SER EL MISMO NOMBRE
    if (!token) {
        window.location.href = "index.html";
    }
})();