const { Sequelize } = require('sequelize');
const configs = require('./config/config.json').development;
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(configs.database, configs.username, configs.password, {
    host: configs.host,
    dialect: configs.dialect
});

const UserModel = require('./models/user')(sequelize, Sequelize);
const NoteModel = require('./models/note')(sequelize, Sequelize);

//usermodel

async function Connect() {
    try {
        await sequelize.authenticate();
        console.log('Connection');
    } catch (error) {
        console.error('No connection', error);
    }
}

async function CreateUser(username, password, admin){
    let hash_password = await bcrypt.hash(password, 10);
    let newUser = UserModel.build({
        username: username,
        password: hash_password,
        admin: admin
    })

    return await newUser.save();
}

async function Find(username){
    return await UserModel.findOne({
        where:{username: username}
    })
}

async function FindById(id){
    return await UserModel.findOne({
        where:{ id: id}
    })
}

async function GetPassword(username){
    let User = await Find(username);
    return User.password
}

async function Delete(id){
    let User = await FindById(id);
    await User.destroy();
}

async function UpdateUsername(id, username){
    let User = await FindById(id);
    User.username = username;
    await User.save();
}

async function UpdatePassword(id, password) {
    let User = await FindById(id);
    let hash_password = await bcrypt.hash(password, 10);
    User.password = hash_password;
    await User.save();
}

//notemodel

async function FindNote(username, id) {
    return await NoteModel.findOne({
        where: {
            userID: (await Find(username)).id,
            id: id
        }
    })
}

async function FindAllNotes(username) {
    return await NoteModel.findAll({
        where: {
            userID: (await Find(username)).id
        }
    })
}

async function AddNote(username, title, text, data) {
    const User = await Find(username)
    let newNote = NoteModel.build({
        title: title,
        text: text,
        data: data,
        userID: User.id
    })

    return await newNote.save();
}

async function RemoveNote(username, id) {
    const Note = await FindNote(username, id);
    await Note.destroy()
}

exports.Connect = Connect;
exports.FindById = FindById;
exports.Find = Find;
exports.CreateUser = CreateUser;
exports.GetPassword = GetPassword;
exports.Delete = Delete;
exports.UpdateUsername = UpdateUsername;
exports.UpdatePassword = UpdatePassword;
exports.RemoveNote = RemoveNote;
exports.AddNote = AddNote;
exports.FindNote = FindNote;
exports.FindAllNotes = FindAllNotes;
exports.UserModel = UserModel;