import models from '../models'

models()
  .sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database tables created!')
    process.exit()
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
