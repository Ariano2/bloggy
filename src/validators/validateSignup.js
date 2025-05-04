const validateSignup = function (data) {
  const { firstName, lastName, email, age, password } = data;
  if (!firstName || !lastName || !email || !age || !password) {
    throw new Error('Incomplete Sign Up Details');
  }
  if (firstName.trim().length < 3 || firstName.trim().length > 50)
    throw new Error('firstName must be 3 to 50 characters long');
  if (lastName.trim().length < 3 || lastName.trim().length > 50)
    throw new Error('lastName must be 3 to 50 characters long');
  if (age < 18 || age > 150) throw new Error('valid age range is 18 to 150');
  const emailRe = new RegExp(
    "[a-z0-9.!#$%&'`*+-/=^_{}|~]+@((.)?[a-zA-Z0-9-])+$"
  );
  if (!emailRe.test(email)) throw new Error('email is Invalid');
  if (password.length < 3 || password.length > 50)
    throw new Error('password length between 3 to 50 characters!');
  return true;
};

module.exports = validateSignup;
