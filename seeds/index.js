const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Review = require('../models/review');

main()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error.bind(console, "connection error:"));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/yelpCamp");
};

const sample = array => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
  await Campground.deleteMany({});
  await Review.deleteMany({});
    for (let i = 0; i < 350; i++) {
      const random1000 = Math.floor(Math.random() * 1000);
      const price = Math.floor(Math.random() * 20) + 13;

      const camp = new Campground({
          author: '654a76df3176487dea388a70',
          location: `${cities[random1000].city}, ${cities[random1000].state}`,
          title: `${sample(descriptors)} ${sample(places)}`,
          description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae porro facilis saepe fugit est veniam! Nihil, possimus nesciunt. Veritatis, ad! Autem aliquid voluptates officiis praesentium quaerat deleniti labore! Velit, molestias!',
          price: price,
          images: [
            {
              url: 'https://res.cloudinary.com/dfemybqoz/image/upload/v1699807106/YelpCamp/wvyakiij3ker2hwghiin.jpg',
              filename: 'YelpCamp/wvyakiij3ker2hwghiin',
            }
          ],
          geometry: {
            type: 'Point',
            coordinates: [
              cities[random1000].longitude,
              cities[random1000].latitude,
            ]
          },
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
