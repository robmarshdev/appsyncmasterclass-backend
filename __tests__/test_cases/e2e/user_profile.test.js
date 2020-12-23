require("dotenv").config();
const given = require("../../steps/given");
const when = require("../../steps/when");
const then = require("../../steps/then");
const chance = require("chance").Chance();
const path = require("path");

describe("Given an authenticated user", () => {
  let user;
  let profile;

  beforeAll(async () => {
    user = await given.an_authenticated_user();
  });

  it("The user can fetch their profile with getMyProfile", async () => {
    profile = await when.a_user_calls_getMyProfile(user);

    expect(profile).toMatchObject({
      id: user.username,
      name: user.name,
      imageUrl: null,
      backgroundImageUrl: null,
      bio: null,
      location: null,
      website: null,
      birthDate: null,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
      // tweets,
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
    });

    const [firstName, lastName] = user.name.split(" ");
    expect(profile.screenName).toContain(firstName);
    expect(profile.screenName).toContain(lastName);
  });

  it("The user can get a URL to upload new profile image", async () => {
    const uploadUrl = await when.a_user_calls_getImageUploadUrl(
      user,
      ".jpeg",
      "image/jpeg"
    );

    const bucketName = process.env.BUCKET_NAME;
    const regex = new RegExp(
      `https://${bucketName}.s3-accelerate.amazonaws.com/${user.username}/.*\.jpeg\?.*Content-Type=image%2Fjpeg.*`
    );

    expect(uploadUrl).toMatch(regex);

    const filePath = path.join(__dirname, "../../data/image.jpg");
    await then.user_can_upload_image_to_url(uploadUrl, filePath, "image/jpeg");

    const downloadUrl = uploadUrl.split("?")[0];
    await then.user_can_download_image_from_url(downloadUrl);
  });

  it("The user can edit their profile with editMyProfile", async () => {
    const newName = chance.first();
    const input = {
      name: newName,
    };
    const profile = await when.a_user_calls_editMyProfile(user, input);

    expect(profile).toMatchObject({
      ...profile,
      name: newName,
    });

    const [firstName, lastName] = user.name.split(" ");
    expect(profile.screenName).toContain(firstName);
    expect(profile.screenName).toContain(lastName);
  });
});
