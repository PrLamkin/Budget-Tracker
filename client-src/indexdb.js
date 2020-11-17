export function useIndexdb(dbName, storeName, method, data) {
    return new Promise((resolve, reject) => {
        const req = indexdb.open(dbName, 1);
        let db, tx, store;

        req.onupgradeneeded = () => {
            const db = req.result;
            db.createObjectStore(storeName, {
                keyPath: method === "add" ? "indexId" : "_id",
                autoIncrement: method === "add" ? true : false
            });
        };

        req.onerror = (e) => reject(e);

        req.onsuccess = () => {
            db = req.result;
            tx = db.transaction(storeName, "readwrite");
            store = tx.objectStore(storeName);

            db.onerror = (error) => console.trace(error);

            switch (method) {
                case "putArr":
                    {
                        for (let i of data) {
                            store.put(i);
                        }
                    }
                    break;
                case "add":
                    {
                        store.add(data);
                    }
                    break;
                case "post":
                    {
                        const all = store.getAll();
                        all.onsuccess = () => {
                            if (all.result.length > 0) {
                                fetch("/api/transaction/bulk", {
                                        method: "POST",
                                        body: JSON.stringify(all.result),
                                        headers: {
                                            Accept: "application/json, text/plain, */*",
                                            "Content-Type": "application/json"
                                        }
                                    })
                                    .then((response) => response.json())
                                    .then(() => {
                                        const transaction = db.transaction(storeName, "readwrite");

                                        const store = transaction.objectStore(storeName);

                                        store.clear();
                                    });
                            }
                        };
                    }
                    break;
                default:
                case "get":
                    {
                        const all = store.getAll();
                        all.onsuccess = () => resolve(all.result);
                    }
                    break;
            }
            tx.oncomplete = () => db.close();
        };
    });
}

export function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}

export function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then((response) => response.json())
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");

                    const store = transaction.objectStore("pending");

                    store.clear();
                });
        }
    };
}