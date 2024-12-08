// import { yourFunction } from './yourModule';
// test('should return expected value', () => {
//   const result = yourFunction(/* parameters */);
//   expect(result).toBe(expectedValue);
// });

// //jest mock 
// import { getUser } from './userApi';
// jest.mock('./userApi');
// beforeEach(() => {
//   jest.clearAllMocks(); // 或者 jest.resetAllMocks();
// });
// test('should return mocked user data', async () => {
//   const mockUserData = { id: '1', name: 'John Doe' };
//   (getUser as jest.Mock).mockResolvedValue(mockUserData);

//   const user = await getUser('1');
//   expect(user).toEqual(mockUserData);
//   expect(getUser).toHaveBeenCalledWith('1');
// });

test('should return expected value', () => {
  const result = "name";
  expect(result).toBe("name");
});