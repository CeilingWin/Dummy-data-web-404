var mysql      = require('mysql');
var config = require('config');
var fs = require('fs');
var faker = require('faker');
var connection = mysql.createConnection({
    host: config.get('db.host'),
    port: config.get('db.port'),
    user: config.get('db.user'),
    password: config.get('db.password'),
    multipleStatements: true
    // database: config.get('db.database')
});
 
connection.connect((err)=>{
    if (err) throw err;
});

connection.query('USE ??',[config.get('db.database')],(err)=>{
    if (err) {
        console.log(`Database ${config.get('db.database')} is not exist`);
        connection.query('CREATE DATABASE ??',[config.get('db.database')],(err)=>{
            if (err) throw err;
            console.log(`Created database ${config.get('db.database')}`);
            connection.query('USE ??',[config.get('db.database')],dropAllTable);
        });
    }
    else dropAllTable();
});
var dropAllTable = ()=>{
    let listTables = ['Bill','Product','User'];
    listTables.forEach((table,index)=>{
        connection.query('DROP TABLE '+table,(err)=>{
            if (!err) 
                console.log('Drop table '+table);
            if (index === listTables.length -1 ) {
                createTable();
            }
        });
    });
}

var createTable = ()=>{
    // create table
    let sqlQuery = fs.readFileSync('create_table.sql','utf-8');
    connection.query(sqlQuery,(err)=>{
        if (err) throw err;
        console.log('Created tables');
        dummyData();
    });
}

var dummyData = ()=>{
    // dummy user
    faker.locale = 'vi';
    let numUser = config.get('dummy.numUser');
    let listAttributes = ['fullName','email','password','isAdmin'];
    for (let i=0;i<numUser;i++){
        let fullName = faker.name.findName();
        let email = (String(i) + faker.internet.email()).toLowerCase();
        let password = Math.random()>0.5? "123456":"root";
        let isAdmin = Math.random()>0.8? 1:0;
        connection.query("INSERT INTO User(fullName,email,password,isAdmin) VALUES (?,?,?,?)",[fullName,email,password,isAdmin]);
    }
    console.log("dummied user");

    // dummy Product
    let numProduct = config.get('dummy.numProduct');
    listAttributes = ['name', 'type','price','quantity','userID','imgUrl','description'];
    let listType = ['phone','tv','pc','switch','laptop'];
    for (let i=0;i<numProduct;i++){
        let name = faker.commerce.productName();
        let type = listType[faker.datatype.number({min:0,max:listType.length-1})];
        let price = Math.round(Math.random()*10000000) + 1;
        let quantity = Math.round(Math.random()*100)+100;
        let userID = faker.datatype.number({min:1,max:numUser});
        let imgUrl = faker.internet.url();
        let description = faker.commerce.productDescription();
        connection.query({
            sql: "INSERT INTO Product(name,type,price,quantity,userID,imgUrl,description) VALUES (?,?,?,?,?,?,?)",
            values: [name,type,price,quantity,userID,imgUrl,description]
        });
    }
    console.log("dummied product");

    // dummy Bill
    let numBill = config.get('dummy.numBill');
    for (let i=0;i<numBill;i++){
        let userID = faker.datatype.number({min:1,max:numUser});
        let productID = faker.datatype.number({min:1,max:numProduct});
        let quantity = faker.datatype.number({min:1,max:100});
        let pay = faker.datatype.number({min:0,max:0});
        connection.query({
            sql: "INSERT INTO Bill(userID,productID,quantity,pay) VALUES(?,?,?,?)" ,
            values: [userID,productID,quantity,pay]
        });
    }
    console.log("dummied bill");
    connection.end();
}
