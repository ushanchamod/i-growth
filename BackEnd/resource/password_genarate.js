import generator from 'generate-password'

const GeneratePassword = generator.generate({ length: 6, numbers: true});

export default GeneratePassword;