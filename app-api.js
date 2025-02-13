import "dotenv/config"

import { userDatabase, userMap } from "./database.js"
import fs from "fs";


// there are two ways the telegram server contacts this app.js
// 1. polliing which is done here, it repetedily sends request to the server to check for messages
// 2. using a webhook : this sets up a server for this both so the telegram server posts the data in that server the bot handles it

const token = process.env.bot_key;
const X_API_key = process.env.X_key
const url = `https://api.telegram.org/bot${token}`;


//
let messageButtons = [[]]
let reply_markup = {};
let detailMap = {
    chh: "height",
    chw: "weight",
    cha: "age"
}

const dateToNum = () => {
    let dt = new Date();
    let dtnum = (dt.getDate() * 1000000) + ((dt.getMonth()+1) * 10000) + dt.getFullYear();
    return dtnum;
}
const customKeyboards = [];
const createKeyboard = () => {
    const keys = [
        [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
        [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12]],
    ]
    customKeyboards[0] = [];
    keys[0].forEach(element => {
        let a = [];
        element.forEach(e => {
            a.push({
                text: e,
                callback_data: `ft-${e}`
            })
        });
        customKeyboards[0].push(a);
    })
    customKeyboards[1] = [];
    keys[1].forEach(element => {
        let a = [];
        element.forEach(e => {
            a.push({
                text: e,
                callback_data: `in-${e}`
            })
        });
        customKeyboards[1].push(a);
    });
    customKeyboards[2] = [
        [
            {
                text: "Male",
                callback_data: `se-m`
            },
            {
                text: "Female",
                callback_data: `se-f`
            }
        ],
        [
            {
                text: "Other",
                callback_data: `se-o`
            }
        ]
    ]
    customKeyboards[3] = [
        [
            {
                text: "Sedentary: little or no exercise",
                callback_data: `ac-sedentary`
            }
        ],
        [
            {
                text: "Exercise 1-3 times/week",
                callback_data: `ac-lightlyActive`
            }
        ],
        [
            {
                text: "Exercise 3-5 times/week",
                callback_data: `ac-moderatelyActive`
            }
        ],
        [
            {
                text: "Exercise 6-7 times/week",
                callback_data: `ac-active`
            }
        ],
        [
            {
                text: "Very intensive lifestyle.",
                callback_data: `ac-veryActive`
            }
        ],
    ]

}
createKeyboard();
const componentMap = {
    weight: {
        unit: "kgs",
        detail: "w"
    },
    height: {
        unit: "cms",
        detail: "h"
    },
    age: {
        unit: "yrs",
        detail: "a"
    }
}
const setWtKeyboard = (wgt, component = "weight") => {
    //for weight

    let unit = componentMap[component]["unit"];
    let detail = componentMap[component]["detail"];
    let wt = [
        [
            {
                text: `-1`,
                callback_data: `ch${detail}-1`
            },
            {
                text: `${wgt} ${unit}`,
                callback_data: "%%"
            },
            {
                text: `+1`,
                callback_data: `ch${detail}+1`
            }
        ],
        [
            {
                text: `-10`,
                callback_data: `ch${detail}-10`
            },
            {
                text: `+10`,
                callback_data: `ch${detail}+10`
            }
        ],
        [
            {
                text: "Submit",
                callback_data: `sb${detail}`
            }
        ]
    ]
    console.log(`the detail is sb${detail}`)
    return wt;
}


//for editing messages we use messageID and for sending messages userID
const sendMessage = (chat, message) => {
    fetch(`${url}/sendMessage?chat_id=${chat.id}&text=${message}`)
        .then(
        // console.log('message sent to ', chat.first_name)
    )
        .catch((err) => {
            console.log('error in sending normal message ', err)
        })
}

const sendMessageWithMarkup = (chat, message, reply_markup) => {
    fetch(`${url}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chat.id,
            text: message,
            reply_markup: reply_markup, // Properly serialized JSON
        }),
    })
        .then(
        // console.log('message sent to ', chat.first_name)
    )
        .catch((err) => {
            console.log('error in sending message with reply_markup ', err)
        })
}

const editMessageReplyMarkup = (message, reply_markup, newMessage, nomarkup = false) => {
    if (nomarkup) {
        fetch(`${url}/editMessageText`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: message.chat.id,
                text: newMessage,
                message_id: message.message_id,
            })
        })
            .then(
            // console.log('message edited in ', message.message_id)
        )
            .catch(console.log("error in editing message"))
        return;
    }
    fetch(`${url}/editMessageText`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: message.chat.id,
            text: newMessage,
            message_id: message.message_id,
            reply_markup: reply_markup
        })
    })
        .then(console.log('message edited in ', message.message_id))
        .catch(console.log("error in editing message"))

}

const deleteMessage = (chatID, message_id) => {
    fetch(`${url}/deleteMessage?chat_id=${chatID}&message_id=${message_id}`)
        .then((e) => console.log('succesfully deleted message')
        ).catch((err) => console.log('Error in deleteing message: ', err)
        )
}
const userExists = (chkuserId) => {
    for (let user of userDatabase)
        if (user.userId == chkuserId) return true;
}

const askHeight = (sender, messageobj = false) => {
    let messageButtons = [[
        {
            text: "Feet & inches",
            callback_data: "ht-feet",
        },
        {
            text: "Centimeters",
            callback_data: "ht-cm",
        },
    ]]
    let reply_markup = {
        inline_keyboard: messageButtons
    }
    let message = `In what units do you know your height?`
    if (!messageobj) sendMessageWithMarkup(sender, message, reply_markup)
    else editMessageReplyMarkup(messageobj, reply_markup, message)
}
const askAge = (sender, messageobj = false) => {
    let messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]].age = 20, "age");
    reply_markup = {
        inline_keyboard: messageButtons
    }
    if (!messageobj) sendMessageWithMarkup(sender, "What about your age?", reply_markup)
    else editMessageReplyMarkup(messageobj, reply_markup, "What about your age?")
}

const askWeight = (sender, messageobj = false) => {
    let messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]].weight = 50, "weight");
    reply_markup = {
        inline_keyboard: messageButtons
    }
    if (!messageobj) sendMessageWithMarkup(sender, "What about your weight?", reply_markup)
    else editMessageReplyMarkup(messageobj, reply_markup, "What about your weight?")
}

const askGender = (sender, messageobj = false) => {
    userDatabase[userMap[sender.id]].gender = "Male"
    let messageButtons = customKeyboards[2];
    reply_markup = {
        inline_keyboard: messageButtons
    }
    if (!messageobj) sendMessageWithMarkup(sender, "And you identify yourself as?", reply_markup)
    else editMessageReplyMarkup(messageobj, reply_markup, "You identify yourself as?")
}

const askActivity = (sender, messageobj = false) => {
    userDatabase[userMap[sender.id]].activity = "lightlyActive"
    let messageButtons = customKeyboards[3];
    reply_markup = {
        inline_keyboard: messageButtons
    }
    if (!messageobj) sendMessageWithMarkup(sender, "Lastly how active are you", reply_markup)
    else editMessageReplyMarkup(messageobj, reply_markup, "How active are you")
}

const askTarget = (sender, calData) => {
    const messageButtons = []
    for (let key in calData) {
        messageButtons.push([{
            text: `${key}: ${calData[key]}`,
            callback_data: `cl-${calData[key]}`
        }])
    }
    reply_markup = {
        inline_keyboard: messageButtons
    }
    sendMessageWithMarkup(sender, "Following are the maintainence calories required for you. Choose a Daily Calorie target according to your Goals.\nRemember being consistent with realistic goals is better than only starting with motivated goals", reply_markup)
}

const calculateCalories = (sender) => {
    const url = `https://do-calculate.com/api/calculate-calories`;
    const bdy = {
        activity: userDatabase[userMap[sender.id]].activity,
        weight: userDatabase[userMap[sender.id]].weight,
        height: userDatabase[userMap[sender.id]].height,
        age: userDatabase[userMap[sender.id]].age,
        gender: userDatabase[userMap[sender.id]].gender
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bdy)
    }
    let calData = {}
    fetch(url, options)
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            calData = data.result.dailyCalories;
            console.log('Calories fetched Succesfully');
            askTarget(sender, calData);
        })
        .catch((err) => {
            console.log('Error in fetching calories', err);
        })
}

const addcalories = (message, sender, set = false) => {
    const date = dateToNum();
    const words = message.text.split(" ");
    let cal, prot;
    for (let i = 0; i < words.length; i++) {
        if (words[i] == "calories") cal = parseInt(words[i - 1]);
        if (words[i] == "protein") prot = parseInt(words[i - 1]);
    }
    if (set) {
        console.log("set is ",set);
        cal = Math.round(cal*set);
        prot = Math.round(prot*set);
    }
    
    if (!Number.isFinite(cal) || !Number.isFinite(prot)) {
        console.log(`calories is `,cal);
        console.log(`protein is `,prot);
        console.log(`text is `,words);
        return;
    }
    let ob = userDatabase[userMap[sender.id]].diary[date];
    if (ob) {
        console.log('data exists');
        ob.calories = parseInt(ob.calories) + cal;
        ob.protein = parseInt(ob.protein) + prot;
        ob.balance_cal = Math.max(0, parseInt(ob.balance_cal) - cal);
        let balance_cal = ob.balance_cal;
        if(set){
            sendMessage(sender,`${cal} calories added to today, you have ${balance_cal} more calories to go..`);
            deleteMessage(sender.id,message.message_id);
        }
        else editMessageReplyMarkup(message, "", `${cal} calories added to today, you have ${balance_cal} more calories to go..`);
    }
    else {
        console.log('data does not exists');
        userDatabase[userMap[sender.id]].diary[date] = {
            balance_cal: parseInt(userDatabase[userMap[sender.id]].targetCalories) - cal,
            calories: cal,
            protein: prot
        }
        ob = userDatabase[userMap[sender.id]].diary;
        let balance_cal = ob[date].balance_cal;
        if(set){
            sendMessage(sender,`${cal} calories added to today, you have ${balance_cal} more calories to go..`);
            deleteMessage(sender.id,message.message_id);
        }
        else editMessageReplyMarkup(message, "", `${cal} calories added to today, you have ${balance_cal} more calories to go.`);
    }
}

const handleCallback = (callback) => {
    const sender = callback.from;
    const message = callback.message;
    const data = callback.data;
    const msgType = data.slice(0, 2)
    const detailType = data[2];
    let messageButtons = [];
    switch (msgType) {
        case "ht": //height
            messageButtons = [];
            switch (data) {
                case "ht-feet":
                    messageButtons = customKeyboards[0]
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    let newMessage = `So how many feets do you surpass?`
                    editMessageReplyMarkup(message, reply_markup, newMessage)
                    break;
                case "ht-cm":
                    userDatabase[userMap[sender.id]].height = 150
                    messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]].height, "height");
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `What about your height in cm?`)
                    break;
                default:
                    console.log('Default in callback 2');
            }
            break;
        case "ft": //feet
            messageButtons = [];
            let ft = parseInt(data.slice(3, data.length))
            userDatabase.forEach(user => {
                if (user.userId == sender.id) { user.height = ft * 12; }
            });
            messageButtons = customKeyboards[1]
            reply_markup = {
                inline_keyboard: messageButtons
            }
            let newMessage = `And how many inches above that?`
            editMessageReplyMarkup(message, reply_markup, newMessage)
            break;

        case "in": //inch
            let inc = parseInt(data.slice(3, data.length))
            let feet = Math.floor(userDatabase[userMap[sender.id]].height / 12);
            userDatabase[userMap[sender.id]].height += inc;
            userDatabase[userMap[sender.id]].height = Math.round(userDatabase[userMap[sender.id]].height * 2.54)
            messageButtons = [[
                {
                    text: "Change?",
                    callback_data: "as-h"
                }
            ]];
            reply_markup = {
                inline_keyboard: messageButtons
            }
            editMessageReplyMarkup(message, reply_markup, `Your height is ${feet} feet ${inc} inches.`)
            if (!userDatabase[userMap[sender.id]].weight) askWeight(sender)
            break;

        case "ch": // for incrementing and decrementing in custom selector
            let det = data.slice(0, 3);
            console.log(det)
            switch (data) {
                case `${det}-1`:
                    userDatabase[userMap[sender.id]][detailMap[det]] -= 1
                    messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]][detailMap[det]], detailMap[det]);
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `What about your ${detailMap[det]}?`)
                    break;
                case `${det}+1`:
                    userDatabase[userMap[sender.id]][detailMap[det]] += 1
                    messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]][detailMap[det]], detailMap[det]);
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `What about your ${detailMap[det]}?`)
                    break;
                case `${det}-10`:
                    userDatabase[userMap[sender.id]][detailMap[det]] -= 10
                    messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]][detailMap[det]], detailMap[det]);
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `What about your ${detailMap[det]}?`)
                    break;
                case `${det}+10`:
                    userDatabase[userMap[sender.id]][detailMap[det]] += 10
                    messageButtons = setWtKeyboard(userDatabase[userMap[sender.id]][detailMap[det]], detailMap[det]);
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `What about your ${detailMap[det]}?`)
                    break;
                default:
                    console.log('defualt in callback wt');
            }
            break;

        case "sb": //submit button for height in cms, weight and age
            let typ = "ch" + detailType;
            let unit = componentMap[detailMap[typ]].unit;
            // sendMessage(message.chat, `your ${detailMap[typ]} is ${userDatabase[userMap[sender.id]][detailMap[typ]]} ${unit}`)
            if (typ == "chh") {
                messageButtons = [[
                    {
                        text: "Change?",
                        callback_data: "as-h"
                    }
                ]];
                reply_markup = {
                    inline_keyboard: messageButtons
                }
                editMessageReplyMarkup(message, reply_markup, `your ${detailMap[typ]} is ${userDatabase[userMap[sender.id]][detailMap[typ]]} ${unit}`);
                if (!userDatabase[userMap[sender.id]].weight) askWeight(sender)
            }
            if (typ == "chw") {
                messageButtons = [[
                    {
                        text: "Change?",
                        callback_data: "as-w"
                    }
                ]];
                reply_markup = {
                    inline_keyboard: messageButtons
                }
                editMessageReplyMarkup(message, reply_markup, `yours ${detailMap[typ]} is ${userDatabase[userMap[sender.id]][detailMap[typ]]} ${unit}`);
                if (!userDatabase[userMap[sender.id]].gender) askGender(sender)
            }
            if (typ == "cha") {
                messageButtons = [[
                    {
                        text: "Change?",
                        callback_data: "as-a"
                    }
                ]];
                reply_markup = {
                    inline_keyboard: messageButtons
                }
                editMessageReplyMarkup(message, reply_markup, `your ${detailMap[typ]} is ${userDatabase[userMap[sender.id]][detailMap[typ]]} ${unit}`);
                if (!userDatabase[userMap[sender.id]].activity) askActivity(sender)
            }
            break;
        case "se": //gender
            switch (data) {
                case "se-m":
                    userDatabase[userMap[sender.id]].gender = "male"
                    messageButtons = [[
                        {
                            text: "Change?",
                            callback_data: "as-se"
                        }
                    ]];
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `Your Gender is recorded as Male`);
                    if (!userDatabase[userMap[sender.id]].age) askAge(sender);
                    break;
                case "se-f":
                    userDatabase[userMap[sender.id]].gender = "female"
                    messageButtons = [[
                        {
                            text: "Change?",
                            callback_data: "as-se"
                        }
                    ]];
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `Your Gender is recorded as Female`);
                    if (!userDatabase[userMap[sender.id]].age) askAge(sender);
                    break;
                case "se-o":
                    messageButtons = [customKeyboards[2][0]];
                    reply_markup = {
                        inline_keyboard: messageButtons
                    }
                    editMessageReplyMarkup(message, reply_markup, `That's not a thing.`);
                    break;
            }
            break;
        case "ac": //activity
            userDatabase[userMap[sender.id]].activity = data.slice(3, data.length);
            messageButtons = [[
                {
                    text: "Change?",
                    callback_data: "as-ac"
                }
            ]];
            reply_markup = {
                inline_keyboard: messageButtons
            }
            editMessageReplyMarkup(message, reply_markup, `Your Activity is set as ${userDatabase[userMap[sender.id]].activity}`);
            if (!userDatabase[userMap[sender.id]].targetCalories) calculateCalories(sender);
            break;
        case "cl":
            let cl = userDatabase[userMap[sender.id]].targetCalories = data.slice(3, data.length);
            messageButtons = [[
                {
                    text: "Set Custom?",
                    callback_data: "as-cl"
                }
            ]];
            reply_markup = {
                inline_keyboard: messageButtons
            }
            editMessageReplyMarkup(message, reply_markup, `Your daily calorie intake is set to ${cl} calories per day.`);
            userDatabase[userMap[sender.id]].diary={} //initializing diary
            sendMessage(sender,`Great! We are good to go.\n\nFrom now on I'll be your nutritional diary, tell me what you eat and I'll count the calories for you so you don't need to do the math.\nI'll warn you when you go over your for cals.`)
            sendMessage(sender,`You can say something like "I had two masala dosa"`)
            //here

            break;
        case "as": // to edit details call ask___
            switch (data) {
                case "as-a":
                    // deleteMessage(message.chat.id, message.message_id);
                    askAge(sender, message);
                    break;
                case "as-w":
                    // deleteMessage(message.chat.id, message.message_id);
                    askWeight(sender, message);
                    break;
                case "as-se":
                    // deleteMessage(message.chat.id, message.message_id);
                    askGender(sender, message);
                    break;
                case "as-ac":
                    // deleteMessage(message.chat.id, message.message_id);
                    askActivity(sender, message);
                    break;
                case "as-cl":
                    sendMessage(sender, `This option is currently unavailable.`);
                    break;
                case "as-h":
                    // deleteMessage(message.chat.id, message.message_id);
                    askHeight(sender, message);
                    break;
            }
            break;
        case "fd":
            switch (data) {
                case "fd-add":                    
                    addcalories(message, sender);
                    break;
                case "fd-remove":
                    deleteMessage(sender.id, message.message_id);
                    break;
                case "fd-change":
                    fetch(`${url}/answerCallbackQuery?callback_query_id=${callback.id}&text="Please reply to the initial message with the quantity in grams."`)
                        .then(console.log("done"))
                        .catch(console.log("not done"))
            }

            break;
        default:
            console.log('defualt in callback 1');

    }

}

const setupNewUser = (sender) => {
    let userName = sender.first_name + (sender.last_name ? " " + sender.last_name : "");
    if(!userExists(sender.id)){
        userDatabase.push({
            "userId": parseInt(sender.id),
            "name": userName
        })
        userMap[sender.id] = userDatabase.length - 1;
    }
    setTimeout(() =>
        sendMessage(sender, `Hey, ${sender.first_name}! I can count calories for you so you can bother about other things 😉`)
        , 100);
    setTimeout(() =>
        sendMessage(sender, `We need to know a few things about you. Let's begin with how tall are you.`)
        , 110);
    setTimeout(() =>
        askHeight(sender)
        , 500);

}
const handleUpdate = (message) => {
    const sender = message.chat;
    if (message.text[0] == "/") {
        switch(message.text){
            case "/start":
                if (userExists(sender.id)) {
                    if(Object.keys(userDatabase[userMap[sender.id]]).length < 8)setupNewUser(sender);
                    else sendMessage(sender,`Add a food item by saying something like\n\"I had two cups of rice for lunch\"`)
                    // sendMessage(sender, `Welcome back, ${sender.first_name}! What can I do for you today`)
                } else {
                    setupNewUser(sender)
                }
                break;
            case "/reset":
                if(userDatabase[userMap[sender.id]]){
                    userDatabase.splice(userMap[sender.id],1);
                }
                setupNewUser(sender);
                break;
            case "/calories":
                try{
                    let msg=`Your daily calorie target is ${userDatabase[userMap[sender.id]].targetCalories} calories and you've had ${userDatabase[userMap[sender.id]].diary[dateToNum()].calories} today and ${userDatabase[userMap[sender.id]].diary[dateToNum()].balance_cal} more left.`;
                    sendMessage(sender,msg);
                }catch{
                    sendMessage(sender,`You haven't eaten anything today. Tell me when you do!`);
                }
                break;
            case "/protein":
                try{
                    sendMessage(sender,`You have consumed ${userDatabase[userMap[sender.id]].diary[dateToNum()].protein} grams of protein today`);
                }catch{
                    sendMessage(sender,`Guess you haven't had any protein today!`);
                }
                break;
            default:
                sendMessage(sender,`Hey, select a valid command na, I can't do everything!`)
        }
    } else { //non commands
        if (!userDatabase[userMap[sender.id]] || Object.keys(userDatabase[userMap[sender.id]]).length < 8) {
            sendMessage(sender, `You need to complete you details setup first! use /start`)
        }
        else if (message.reply_to_message) { // replies
            switch(message.reply_to_message.text.split(" ")[0]){
                case "Your":
                    let cal=  parseInt(message.text);
                    userDatabase[userMap[sender.id]].targetCalories=cal;
                    break;
                default://this is for editing the quantity of a food item since the first word is a number
                    let wtnew = parseInt(message.reply_to_message.text);
                    let wtold=  parseInt(message.text);
                    if(!wtold){
                        sendMessage(sender,`Please reply a valid quantity.`)
                    }
                    addcalories(message.reply_to_message, sender, (wtold/wtnew));
                    break;
            }
            
            // deleteMessage(sender.id, message.message_id);
        }
        else { //for food item
            const options = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'X-Api-Key': X_API_key
                }
            }
            fetch(`https://api.calorieninjas.com/v1/nutrition?query=${message.text}`, options)
                .then((str) => str.json())
                .then((data) => {
                    
                    if(!data.items.length){sendMessage(sender,`Umm, doesn't seem like something to eat`);}
                    data.items.forEach(food => {
                        let cal=Math.floor(parseFloat(food.calories))
                        let msg = `${food.serving_size_g}g of ${food.name} has ${cal} calories and ${Math.floor(parseFloat(food.protein_g))}g protein .\n Do you want to change quantity?`
                        let date=dateToNum();
                        let ob = userDatabase[userMap[sender.id]].diary;
                        if(ob && ob[date] && cal>ob[date].balance_cal)msg+=`\n\nWarning!\nAdding this you will go over your calorie budget. Do you still want to add this?`;
                        let messageButtons = [
                            [
                                {
                                    text: "Change Quantity",
                                    callback_data: "fd-change",
                                },
                                {
                                    text: "Add this",
                                    callback_data: "fd-add",
                                }
                            ],
                            [
                                {
                                    text: "I didn't had this",
                                    callback_data: "fd-remove",
                                },
                            ]
                        ]
                        let reply_markup = {
                            inline_keyboard: messageButtons
                        }
                        sendMessageWithMarkup(sender, msg, reply_markup)
                    });
                }).catch((err)=>{
                    sendMessage(sender,`Invalid food description error is: ${err}`);
                })
        }
    }
}


// in the getupdate function we map the catered message by a lastUpdateId
// because even tho intervalTime can be very low muliple messages can be recieved in that interval

let isfetching=false;
let lastUpdateId = 0;
const getUpdate = () => {
    if(isfetching)return;
    isfetching=true;
    console.log('Getting message...');

    const timeoutValue = 1;   //dont change this value it is related to and should be less than half of intervalTime
    fetch(`${url}/getUpdates?offset=${lastUpdateId + 1}`)
        .then((updates) => {
            return updates.json();
        }).then((updates) => {
            if (updates.ok) {
                updates.result.forEach(update => {
                    lastUpdateId = update.update_id;
                    // this loop is only to get which type of response is this(message or something else)
                    for (let key in update) {
                        // currently handling only messages
                        if (key == "message") {
                            handleUpdate(update[key]);
                        }
                        if (key == "callback_query") {
                            handleCallback(update[key]);
                        }
                    }
                });
            }
            // else {
            //     console.log(`we have an error code: ${updates.error_code} description: ${updates.description}`);
            // }
        })
        .catch((error) => {
            console.error("Error fetching updates:", error);
        })
        .finally(()=>isfetching=false)
}

(()=>{
    const botCommands=[
        {
            command:"/start",
            description : "Start the bot"
        },
        {
            command:"/reset",
            description : "Restart the bot and add new information"
        },
        {
            command:"/calories",
            description : "Shows the calories for today."
        },
        {
            command:"/protein",
            description : "Shows the protein consumed today."
        },
    ]
    fetch(`${url}/setMyCommands?commands=${JSON.stringify(botCommands,null,2)}`)
})();




// Polling to get Updates
const intervalTime = 800;
const intervalId = setInterval(getUpdate, intervalTime);
// To stop the polling use : clearInterval(intervalId)




let isDataSaved = false;
const saveData = () => {
    if (isDataSaved) {
        return;
    }
    try {
        let updatedContent = `export const userDatabase = ${JSON.stringify(userDatabase, null, 2)};\n`;
        updatedContent += `export const userMap = ${JSON.stringify(userMap, null, 2)};`;

        fs.writeFileSync('./database.js', updatedContent, 'utf8');
        console.log("Database saved successfully!");

        isDataSaved = true;
    } catch (error) {
        console.error("Error saving the database:", error);
    }
};

process.on('exit', () => {
    console.log("Exiting process...");
    saveData();  
});

process.on('SIGINT', () => {
    console.log("SIGINT received, saving data...");
    saveData();  
    process.exit();  
});

process.on('uncaughtException', (err) => {
    console.error("Uncaught exception:", err);
    saveData(); 
    process.exit(1); 
});