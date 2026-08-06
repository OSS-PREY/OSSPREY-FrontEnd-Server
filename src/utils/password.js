// Shared password policy: >= 8 chars and at least three of
// lower / upper / digit / special. Used by register and password reset.
export const PASSWORD_RULE_TEXT =
  'Password must be at least 8 characters long and include at least three of the following: lower case letters, upper case letters, numbers, and special characters.'

export const isPasswordValid = password => {
  if (password.length < 8)
    return false

  const categories = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]

  return categories.filter(re => re.test(password)).length >= 3
}
