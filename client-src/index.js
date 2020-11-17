import registerSW from "./register-service-worker";
import { useIndexdb } from "./indexdb";
import { populateChart, populateTable, populateTotal } from "./chart-helpers";
let transactions = [];
let myChart;

registerSW();
useIndexdb("budget-tracker-pending", "pending", "post");

fetch("/api/transaction")
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        transactions = data;

        populateTotal(transactions);
        populateTable(transactions);
        populateChart(transactions, myChart);
        useIndexdb("budget-tracker", "transactions", "putArr", transactions);
    })
    .catch((err) => {
        useIndexdb("budget-tracker", "transactions").then((data) => {
            transactions = data;

            populateTotal(transactions);
            populateTable(transactions);
            populateChart(transactions, myChart);
        });
    });

function sendTransaction(isAdding) {
    let nameEl = document.querySelector("#t-name");
    let amountEl = document.querySelector("#t-amount");
    let errorEl = document.querySelector(".form .error");

    if (nameEl.value === "" || amountEl.value === "") {
        errorEl.textContent = "Missing Information";
        return;
    } else {
        errorEl.textContent = "";
    }

    let transaction = {
        name: nameEl.value,
        value: amountEl.value,
        date: new Date().toISOString()
    };

    if (!isAdding) {
        transaction.value *= -1;
    }

    transactions.unshift(transaction);

    populateChart(transactions, myChart);
    populateTable(transactions);
    populateTotal(transactions);

    fetch("/api/transaction", {
            method: "POST",
            body: JSON.stringify(transaction),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.errors) {
                errorEl.textContent = "Missing Information";
            } else {
                nameEl.value = "";
                amountEl.value = "";
            }
        })
        .catch(() => {
            console.log("No connection.");
            useIndexdb("budget-tracker-pending", "pending", "add", transaction);
            nameEl.value = "";
            amountEl.value = "";
        });
}

document.querySelector("#add-btn").onclick = function() {
    sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
    sendTransaction(false);
};