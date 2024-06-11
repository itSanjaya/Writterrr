import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import pkg from 'slugify';
const slugify = pkg;

import pkg2 from 'validator';
const {isEmail} = pkg2;

const UserSchema = new mongoose.Schema({email:{
  type: String,
  required: [true, 'Please enter an email'],
  unique: [true, ''],
  lowercase: true,
  validate: [isEmail, 'Please enter a valid email']
},
password: {
  type: String,
  required: [true, 'Please enter an password'],
  minlength: [6, 'Minimum password length is 6 characters']
}
});

const PostSchema = new mongoose.Schema({
  user_id: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  title: {type: String, required: true},
  description: {type: String},
  content: {type: String, required: true},
  createdAt: {type: Date, default: Date.now},
  slug: {type: String, required: true, unique: true},
})

UserSchema.post('save', function (doc, next) {
  console.log('new user was created & saved', doc);
  next();
})

UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
})

PostSchema.pre('validate', function(next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true })
  }
  next()
})

UserSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
      const auth = await bcrypt.compare(password, user.password);

      if (auth) {
          return user;
      }
      throw Error('Incorrect password')
  }
  throw Error('Incorrect email');
}

mongoose.model('User', UserSchema);
mongoose.model('Post', PostSchema);

mongoose.connect('mongodb+srv://finalproject:finalproject@cluster0.ntidtsr.mongodb.net/?retryWrites=true&w=majority')
