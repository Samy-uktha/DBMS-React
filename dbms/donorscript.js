document.addEventListener("DOMContentLoaded", function() {

    const form = document.getElementById("donorForm");

    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const nameVal = document.getElementById("name").value;
            const dobVal = document.getElementById("dob").value;
            const phoneVal = document.getElementById("phone").value;
            const addressVal = document.getElementById("address").value;
            const cityVal = document.getElementById("city").value;
            const bloodVal = document.getElementById("blood").value;

            localStorage.setItem("name", nameVal);
            localStorage.setItem("dob", dobVal);
            localStorage.setItem("phone", phoneVal);
            localStorage.setItem("address", addressVal);
            localStorage.setItem("city", cityVal);
            localStorage.setItem("blood", bloodVal);

            window.location.href = "donordashboard.html";
        });
    }

    if (document.getElementById("dname")) {

        document.getElementById("dname").innerText = localStorage.getItem("name");
        document.getElementById("ddob").innerText = localStorage.getItem("dob");
        document.getElementById("dphone").innerText = localStorage.getItem("phone");
        document.getElementById("daddress").innerText = localStorage.getItem("address");
        document.getElementById("dcity").innerText = localStorage.getItem("city");
        document.getElementById("dblood").innerText = localStorage.getItem("blood");

        // Dummy screening values
        const platelet = 180000;
        const hemo = 13.5;
        const weight = 60;
        const bp = "120/80";
        const pulse = 72;
        const lastDonation = "3 Months Ago";

        document.getElementById("dplatelet").innerText = platelet;
        document.getElementById("dhemo").innerText = hemo;
        document.getElementById("dweight").innerText = weight;
        document.getElementById("dbp").innerText = bp;
        document.getElementById("dpulse").innerText = pulse;
        document.getElementById("dlast").innerText = lastDonation;

        const status = document.getElementById("status");

        if (hemo >= 12 && weight >= 50 && platelet >= 150000) {
            status.innerText = "Eligible for Donation";
            status.style.color = "green";
        } else {
            status.innerText = "Not Eligible for Donation";
            status.style.color = "red";
        }
    }

});

function donate() {
    alert("Thank you for your willingness to donate!");
}