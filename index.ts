import Response from "express";

const createError = require("http-errors");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port: number = 8080;

let contacts = [
    {
        "id": 1,
        "name": "Pepito Pérez",
        "phone": "000-000-0000",
        "email": "pepito@salazarcodes.com"
    },
    {
        "id": 2,
        "name": "Miguelina D' Pérez",
        "phone": "123-456-7890",
        "email": "miguelina@salazarcodes.com"
    },
    {
        "id": 3,
        "name": "Nieves O.",
        "phone": "789-123-4567",
        "email": "nieves@salazarcodes.com"
    }
];

const isEmailValid = (email: string): boolean => {
    const regex = /\w.+@.+\.(|com|)/;
    return regex.test(email);
};

const isPhoneValid = (phone: string): boolean => {
    const regex = /8(|0|2|4|)9-?\d{3}-?\d{4}/;
    return regex.test(phone);
};

const canAdd = (name: string, phone: string, email: string, response: Response): boolean => {
    if (!name) {
        response.json({error: "Name was not specified."});
        return false;
    }

    if (!phone) {
        response.json({error: "Phone was not specified."});
        return false;
    } else if (!isPhoneValid(phone)) {
        response.json({error: `Phone: ${phone} is not valid.`});
        return false;
    }

    if (!email) {
        response.json({error: "Email was not specified."});
        return false;
    } else if (!isEmailValid(email)) {
        response.json({error: `Email ${email} is not valid.`});
        return false;
    }

    let found = contacts.find((contact) => contact.name === name);
    if (found) {
        response.json({error: `Contact: ${name} already exists.`});
        return false;
    }

    found = contacts.find((contact) => contact.email === email);
    if (found) {
        response.json({status: 400, error: `Email: ${email} is already in use.`});
        return false;
    }

    return true;
};

/* First returned value indicates whether the value already exists
 * meanthile the second one indicates whether the caller can continue.
 * This second value is useful when, for example, a mandatory field wasn't
 * specified.
 */
const exists = (request, response): [boolean, boolean] => {
    switch (request.body.field)
    {
    case "name":
        if (!request.body.name) {
            response.json({status: 400, error: "New 'name' was not provided."});
            return [false, false];
        }

        if (contacts.find((contact) => contact.name === request.body.name)) {
            return [true, false];
        }
        break;
    case "phone":
        if (!request.body.phone) {
            response.json({status: 400, error: "New 'phone' was not provided."});
            return [false, false];
        }

        if (contacts.find((contact) => contact.phone === request.body.phone)) {
            return [true, false];
        }
        break;
    case "email":
        if (!request.body.email) {
            response.json({status: 400, error: "New 'email' was not provided."});
            return [false, false];
        }

        if (contacts.find((contact) => contact.email === request.body.email)) {
            return [true, false];
        }
        break;
    default:
        response.json({error: `No such field: ${request.body.field}.`});
        return [false, false];
    }

    return [false, true];
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.param("id", (request, response, next, id) => {
    if (typeof id === "undefined") {
        next(createError(404, "User not found!"));
    }

    request.id = parseInt(id);
    if (isNaN(request.id)) {
        next(createError(400, `ID: ${id} is not valid.`));
    }

    --request.id;

    if (request.id < 0 || request.id >= contacts.length) {
        next(createError(404, `ID: ${id} not found!`));
    }

    next();
});

app.get("/", (request, response) => {
    const options = {root: path.join(__dirname)};
    response.sendFile("index.html", options);
});

app.get("/contacts", (request, response) => {
    response.json(contacts);
});

app.get("/contact/:id", (request, response) => {
    const contact = {
        "id": contacts[request.id].id,
        "name": contacts[request.id].name,
        "phone": contacts[request.id].phone,
        "email": contacts[request.id].email,
    };

    response.json(contact);
});

app.post("/add", (request, response) => {
    if (!request.body) {
        response.json({error: "No data was provided."});
        return;
    }

    if (!canAdd(request.body.name, request.body.phone, request.body.email, response)) {
        return;
    }

    contacts.push({
        "id": contacts.length + 1,
        "name": request.body.name,
        "phone": request.body.phone,
        "email": request.body.email
    });

    response.json({success: `Contact ID: ${contacts.length}`});
});

app.put("/updateById", (request, response) => {
    if (!request.body) {
        response.json({status: 400, error: "No data was provided."});
        return;
    }

    if (!request.body.field) {
        response.json({status: 400, error: "Field to update was not provided."});
        return;
    }

    if (!request.body.id) {
        response.json({status: 400, error: "Contact ID was not provided."});
        return;
    }

    const [found, canContinue] = exists(request, response);

    if (found) {
        response.json({
            status: 400,
            error: `Error updating contact #${request.body.id}. ${request.body.field} already in use.`
        });
        return;
    } else if (!canContinue) {
        return;
    }

    let id: number = parseInt(request.body.id);
    if (typeof id === "undefined") {
        response.json({status: 400, error: `ID: ${request.body.id} is not valid.`});
        return;
    }

    --id;
    if (id < 0) {
        response.json({status: 400, error: `ID: ${request.body.id} is not valid.`});
        return;
    }

    let res = {status: 200, message: ""};
    switch (request.body.field)
    {
    case "name":
        const oldUsername: string = contacts[id].name;
        contacts[id].name = request.body.name;
        res.message = `Old username: ${oldUsername}, new username: ${request.body.name}`;
        break;
    case "phone":
        const oldPhone: string = contacts[id].phone;
        const newPhone: string = request.body.phone;
        if (!isPhoneValid(newPhone)) {
            response.json({status: 400, error: `New phone: ${newPhone} is not valid.`});
            return;
        }
        contacts[id].phone = newPhone;
        res.message = `Old phone: ${oldPhone}, new phone: ${newPhone}`;
        break;
    case "email":
        const oldEmail: string = contacts[id].email;
        const newEmail: string = request.body.email;
        if (!isEmailValid(newEmail)) {
            response.json({status: 400, error: `New email: ${newEmail} is not valid.`});
            return;
        }
        contacts[id].email = newEmail;
        res.message = `Old email: ${oldEmail}, new email: ${newEmail}`;
        break;
    }

    response.json(res);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});
