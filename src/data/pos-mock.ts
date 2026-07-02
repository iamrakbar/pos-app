import type {
  POSCategory,
  POSProduct,
  POSTable,
} from '@/types/pos';

const UNS = 'https://images.unsplash.com/photo';

function img(id: string) {
  return {
    image_url: `${UNS}-${id}?w=400&h=300&fit=crop&q=80`,
    thumbnail_url: `${UNS}-${id}?w=100&h=100&fit=crop&q=80`,
  };
}

export const MOCK_PRODUCTS: POSProduct[] = [
  {
    id: '3519b835-799e-40b5-a473-1406b4a95eff',
    name: 'Eggplant Parmesan',
    price: 100000,
    original_price: null,
    ...img('1512058547-87dedca1b31f'),
    category_id: '60540aff-5a98-48e9-ac3b-5ba6d324f44a',
    is_active: true,
    add_ons: [
      {
        id: '5e8eabf7-6ead-49c5-bf9e-68d5579a9ee8',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'a7caf3f8-c66a-463e-acac-186019a2202e', name: 'Kerupuk', price: 2000 },
          { id: 'cf16d5c5-e4f1-45b4-8895-775eb00bcc6f', name: 'Onion Rings', price: 6000 },
          { id: 'd924c91f-b90f-4578-9c14-d3e3c991bbab', name: 'French Fries', price: 8000 },
          { id: 'c379ebca-9858-421a-9c26-7d914ebfc3e4', name: 'Soup', price: 5000 },
        ],
      },
      {
        id: '76832bec-b76b-4627-9ff5-ceca68ef8855',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '65596b30-f248-43f0-a004-132d522dd707', name: 'BBQ Sauce', price: 1500 },
          { id: '880cd980-7c9e-4a17-b066-ef789993a23e', name: 'Sweet Soy Sauce', price: 1000 },
        ],
      },
      {
        id: 'c3b8547b-fb6d-417e-8c3f-0e682378357c',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: 'e2b1b3c5-3dd0-4610-8d61-61764cae8acf', name: 'Coffee', price: 8000 },
          { id: 'a7730c43-fa78-4098-bc16-ab144d0cd9aa', name: 'Mineral Water', price: 3000 },
          { id: '5540c9d2-07e3-4713-a05d-a34fe41b49cb', name: 'Orange Juice', price: 12000 },
        ],
      },
    ],
  },
  {
    id: '7425971e-6982-4d22-bb50-74e534d40388',
    name: 'Spaghetti Carbonara',
    price: 95000,
    original_price: null,
    ...img('1567620905732-2d1ec7ab7445'),
    category_id: '044980b0-07f4-49c9-a4ce-9574d3274b2b',
    is_active: true,
    add_ons: [
      {
        id: 'ce666150-844f-4ca4-a7a4-2c5a9eef0ab2',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '0dc802c6-180a-4ce1-8a45-3b69cab2a8d3', name: 'Beef', price: 8000 },
          { id: '5d542bbe-bef8-405a-9503-0af103e8678d', name: 'Seafood', price: 12000 },
          { id: 'af1d468b-e7f7-42f3-9814-1d20b51bd966', name: 'Tofu', price: 3000 },
          { id: '9c8703e6-0a74-408e-9df4-0713f476bb31', name: 'Chicken', price: 5000 },
        ],
      },
      {
        id: '24307946-53e4-46a5-bba4-bb35bfce4096',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'a01482b6-4901-41ab-915a-c00a01e46f94', name: 'Medium', price: 0 },
          { id: '0702abc3-b25f-4c91-8093-f1cc18fb8a2b', name: 'Extra Hot', price: 1000 },
        ],
      },
      {
        id: '896bd5bf-74c7-4d16-b452-fc6e8db0b70d',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: 'db862141-9f3d-413c-b13f-11d80de8c971', name: 'Fried Egg', price: 2500 },
          { id: '76d2b1b3-589c-41c3-8154-03b11ac459a7', name: 'Pickles', price: 1000 },
          { id: '3e5fcb51-8ce7-4135-979f-e005bade81db', name: 'Mushrooms', price: 2000 },
          { id: '02099c44-bd1a-4240-9683-c399ceee8934', name: 'Extra Cheese', price: 3000 },
        ],
      },
    ],
  },
  {
    id: 'b1232256-1b90-4042-8343-c2b7b748bcf4',
    name: 'Vietnamese Pho',
    price: 65000,
    original_price: null,
    ...img('1551183065-a7e088e4bbf8'),
    category_id: 'c035eca3-03db-416b-846b-d6fe46640cd0',
    is_active: true,
    add_ons: [
      {
        id: '3b67c216-9a65-414e-9daf-ab7d8fdc0c99',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '9a350e89-96d2-4d84-a677-3d23112d1048', name: 'Pickles', price: 1000 },
          { id: 'a625a40d-0dbe-4fec-ad10-959212253bcc', name: 'Avocado', price: 4000 },
        ],
      },
      {
        id: '995ae287-09a6-4f91-a680-58061d0eba79',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '8eb7dd2b-c747-45c9-847f-c3520f08f2e8', name: 'Iced Tea', price: 5000 },
          { id: 'b50acb7d-db70-4662-b056-1998d3b87344', name: 'Mineral Water', price: 3000 },
          { id: 'e6623341-ec48-4dbb-aaaa-031aa64dcb56', name: 'Coffee', price: 8000 },
        ],
      },
    ],
  },
  {
    id: '2d1fef4b-d6b4-45fa-855a-c34ae9997ec2',
    name: 'Vegetarian Pad Thai',
    price: 23000,
    original_price: null,
    ...img('1512621134-93a03fff5ddb'),
    category_id: '317e588e-ddb2-478a-80fe-a082602dc7ab',
    is_active: true,
    add_ons: [
      {
        id: 'e3e75e01-ec9a-4503-ad40-25b32ad26b4f',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '88a5cd79-9f3a-4848-b4e6-4b62b23fba31', name: 'Chili Sauce', price: 1000 },
          { id: '78654264-1c35-473f-902a-43c8c7546ee9', name: 'Sweet Soy Sauce', price: 1000 },
          { id: '6832a1ae-66ba-4655-96ff-146a9088ad4b', name: 'Garlic Mayo', price: 2000 },
          { id: '44926da5-cef0-476f-836e-8561d92b131b', name: 'BBQ Sauce', price: 1500 },
        ],
      },
      {
        id: '39e4e581-0cde-4862-b07e-07877f1d6c63',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '393fa00e-ba69-4ed6-acbe-80e1fb2940cb', name: 'Chicken', price: 5000 },
          { id: 'e706d81d-5f89-4b75-9ee8-44ec88cf57bc', name: 'Seafood', price: 12000 },
          { id: 'ba4e3faf-b8d8-4b08-a22c-d934e540a64e', name: 'Beef', price: 8000 },
          { id: 'bf912837-2aad-45f2-9e8c-abae0c6981cc', name: 'Tofu', price: 3000 },
        ],
      },
      {
        id: '855df770-7486-4f86-9f21-42b9b19d6d5b',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: 'a81ac9b2-7d86-409a-b6f5-3a5ce768e1d6', name: 'Mushrooms', price: 2000 },
          { id: '3564e786-97c5-4ac1-bb46-b056dcfb6ee3', name: 'Extra Cheese', price: 3000 },
          { id: '2ec620de-ab8b-4134-9bcb-ff251a41baef', name: 'Fried Egg', price: 2500 },
        ],
      },
      {
        id: '51ad1f56-9e19-48f7-bb9f-0d1e9fbee00f',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: 'b30bb566-3941-4822-aca8-d8cb000dfd07', name: 'Coffee', price: 8000 },
          { id: '535f3f80-df63-4b28-abf4-dc7f1d391525', name: 'Mineral Water', price: 3000 },
          { id: 'fa87828a-a5dc-4262-a33c-8a39c5d2ebb1', name: 'Orange Juice', price: 12000 },
        ],
      },
    ],
  },
  {
    id: '01ff3c45-157a-4d1b-937e-36a202600f9d',
    name: 'Wagyu Beef Burger',
    price: 87000,
    original_price: null,
    ...img('1568901346375-23c9450c58cd'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: 'b1167480-15a2-401a-8562-6fc07a5e2961',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '3d98275b-52fd-4282-b202-1e6da2f0a38b', name: 'Fried Egg', price: 2500 },
          { id: '1051ebb6-56ba-4ca4-a09e-050a71ae4694', name: 'Extra Cheese', price: 3000 },
          { id: '5a20a641-396b-4b58-9b48-d483e54970a7', name: 'Pickles', price: 1000 },
        ],
      },
      {
        id: '61b06157-9687-4da8-95d3-b141ee1b21ec',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '5c0299d0-6af4-4691-82c6-05100b071687', name: 'French Fries', price: 8000 },
          { id: '5c75cb00-106c-42d5-813b-6a4029ff4675', name: 'Onion Rings', price: 6000 },
        ],
      },
      {
        id: '85adc89d-21ba-4e3c-91b8-d9d3107fec75',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: 'a79bfa4f-d1f1-4209-ae14-d51d90e004f4', name: 'Iced Tea', price: 5000 },
          { id: '69bfaaf1-6d99-49c4-b552-16e6af069c50', name: 'Orange Juice', price: 12000 },
          { id: '6ebb7847-764f-4f2e-b3fd-b6d9c3c9bbba', name: 'Coffee', price: 8000 },
        ],
      },
      {
        id: '22571304-3fd5-4ba3-8da7-d63f7037d829',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '4c040041-feb7-455f-adbf-01a5a383e49b', name: 'Tofu', price: 3000 },
          { id: 'b5ffbb19-6265-4165-89b6-8232f9b9e5c3', name: 'Beef', price: 8000 },
        ],
      },
      {
        id: '43080099-a50d-41eb-8b4a-d9d928103ae2',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '81b0446e-0952-4470-b869-8fc957cc75f4', name: 'Mild', price: 0 },
          { id: 'edf26113-087a-48be-b73c-2e497325a2b8', name: 'Medium', price: 0 },
          { id: '588f9ebb-89b7-4ca7-824c-186b4f04a4d7', name: 'Hot', price: 0 },
        ],
      },
    ],
  },
  {
    id: 'b691e708-3a3f-4e38-bb91-1dfb3b8ad0e4',
    name: 'Chicken Caesar Wrap',
    price: 13000,
    original_price: null,
    ...img('1546069901-ba9599a7e63c'),
    category_id: '044980b0-07f4-49c9-a4ce-9574d3274b2b',
    is_active: true,
    add_ons: [
      {
        id: '72e14954-0a67-47cb-ac78-58759c015aab',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '7a47e274-8b1b-4720-b6c9-ecd30263c3ee', name: 'Beef', price: 8000 },
          { id: 'b0c257cc-a208-4113-8ba2-3eb4ed3ea737', name: 'Seafood', price: 12000 },
          { id: 'f4db0318-7e7c-4079-8304-b231acb8b576', name: 'Chicken', price: 5000 },
          { id: 'a669f80f-b6fc-4d9b-bccc-7bb17680ecb5', name: 'Tofu', price: 3000 },
        ],
      },
      {
        id: '7978742f-1139-40eb-848e-7baf0a5981bb',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '9fd48626-94dc-4d6e-8fef-199f879ec667', name: 'Chili Sauce', price: 1000 },
          { id: '9a372a3f-e28a-4c89-b9e1-c4b07e576f5e', name: 'Garlic Mayo', price: 2000 },
          { id: '741e7c78-cc95-4333-b4c3-ded2aa8e42e5', name: 'BBQ Sauce', price: 1500 },
          { id: '39e34fac-08db-4da3-a17d-163546bcb9cb', name: 'Sweet Soy Sauce', price: 1000 },
        ],
      },
      {
        id: '9660b237-3c3c-4e67-b080-699eee90bfb3',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '010977b4-5c05-434e-a442-0121a45f7fe3', name: 'Medium', price: 0 },
          { id: '7ab3e3ad-f5de-434e-a308-0f5e9fa29348', name: 'Extra Hot', price: 1000 },
          { id: '89cba4ab-5b1e-4430-919d-5da18aeddc0f', name: 'Mild', price: 0 },
        ],
      },
    ],
  },
  {
    id: 'fe97f77f-5cde-4a53-aed6-1f5c41e4aa7e',
    name: 'Shakshuka with Dukkah',
    price: 19000,
    original_price: null,
    ...img('1569050467447-ce54b3bbc37d'),
    category_id: '044980b0-07f4-49c9-a4ce-9574d3274b2b',
    is_active: true,
    add_ons: [
      {
        id: '87c7ab8d-c1e6-4945-9a98-05983eb0679d',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '50e4da48-be61-4353-ab65-fe254a03df66', name: 'Extra Hot', price: 1000 },
          { id: '82df7499-a93e-4259-a8bd-c6ec19787ad5', name: 'Medium', price: 0 },
          { id: 'bd8220a0-a8ba-4d37-99e6-6cfecdccb201', name: 'Hot', price: 0 },
        ],
      },
      {
        id: '90eba509-27d3-47a8-b6fa-44945c94cbf2',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'ce0569f1-3ad8-4a45-bd9a-82ffdc67b717', name: 'Beef', price: 8000 },
          { id: '353e3d5f-66a2-4f63-beca-d9bed0f975db', name: 'Chicken', price: 5000 },
        ],
      },
      {
        id: '8da96f33-6f9f-48ff-ad27-6c13771e0ef4',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '94054a0c-62bb-4508-8647-72b4d84637ab', name: 'Sweet Soy Sauce', price: 1000 },
          { id: '94eb5fff-eca0-4f52-b345-9e406ea0aaea', name: 'Garlic Mayo', price: 2000 },
          { id: '56e288eb-a233-4612-8fe9-ff43cd429911', name: 'Chili Sauce', price: 1000 },
          { id: 'caf3ef5e-70ac-4e47-a89e-deeeea491e69', name: 'BBQ Sauce', price: 1500 },
        ],
      },
    ],
  },
  {
    id: 'a5c5b7ef-cdb4-4c60-887d-47deeb4140b1',
    name: 'Mushroom & Swiss Burger',
    price: 97000,
    original_price: null,
    ...img('1547592180-f3a10dde5938'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: '9f39aef7-8cc0-438e-806e-1af144284497',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: 'e2e95684-4bbc-4d4b-8299-beae986e9766', name: 'Mineral Water', price: 3000 },
          { id: 'e903031d-591d-4215-a279-5993599bf850', name: 'Coffee', price: 8000 },
          { id: 'e453b544-769d-444f-9a29-1059829a2288', name: 'Iced Tea', price: 5000 },
          { id: '767f79fd-fa08-4151-9e8c-30d69cc2cc11', name: 'Orange Juice', price: 12000 },
        ],
      },
      {
        id: '708e0d66-3a67-4ff0-8017-931042884320',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'aa73ad11-b8a4-4ca3-a139-b3d6ad535b5f', name: 'Extra Hot', price: 1000 },
          { id: 'd1694297-9237-4aad-bbdd-20a02dd30545', name: 'Hot', price: 0 },
          { id: '6c2a69c3-6c1e-47bb-ad97-63fd4cb4c641', name: 'Mild', price: 0 },
          { id: '0573d765-4476-4a79-a731-75de3ed2dfca', name: 'Medium', price: 0 },
        ],
      },
      {
        id: '72d63ba7-17d0-424d-a7d1-b3f3fb36de74',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '42f59d23-9b9c-424a-b49f-e9d388837027', name: 'Seafood', price: 12000 },
          { id: '2d2398d9-9922-4d73-bbb9-34126b367fd2', name: 'Chicken', price: 5000 },
        ],
      },
    ],
  },
  {
    id: '1ff6e187-8dff-47e9-aa32-17d9e04af1f9',
    name: 'BBQ Pulled Beef Nachos',
    price: 56000,
    original_price: null,
    ...img('1553361419-eab3b01e3d8a'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: '1997c77d-d5bf-4c10-9a96-799014636f19',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'f64dab8a-a7b2-4563-abf4-9449882e37a6', name: 'Extra Hot', price: 1000 },
          { id: '4588b62f-38db-4ea5-adc1-c2dd2bb23826', name: 'Medium', price: 0 },
        ],
      },
      {
        id: '67b85357-2afc-4832-bbe1-2a1bbb97161a',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '06b435f4-cd5c-4431-a44c-ac05368b1c84', name: 'Iced Tea', price: 5000 },
          { id: '56b092d5-c937-4c01-8d2b-5fa08a6cc606', name: 'Mineral Water', price: 3000 },
          { id: 'c501bfc4-b6f9-40a0-9321-0e0b43688f96', name: 'Coffee', price: 8000 },
        ],
      },
      {
        id: 'c22138d2-e6bf-4c46-ad12-4a69d42bd794',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'd5d20213-6cc1-410d-b42d-f9ebcb41380d', name: 'Garlic Mayo', price: 2000 },
          { id: '2e7637b4-991a-47b0-b027-c09e8aef87e5', name: 'Sweet Soy Sauce', price: 1000 },
          { id: '5567b4dd-26a5-4738-a5d1-7972061bd5b5', name: 'BBQ Sauce', price: 1500 },
          { id: 'a5cb2157-b256-484b-a3a4-a74242727067', name: 'Chili Sauce', price: 1000 },
        ],
      },
      {
        id: '84afd842-f53f-4777-94bb-acbb0e1cfe6b',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '6f632a48-908b-4701-975a-231c1aa7f265', name: 'Extra Cheese', price: 3000 },
          { id: 'a881ad40-5d76-49f6-a9ce-908a4b283e89', name: 'Pickles', price: 1000 },
          { id: '0d42839e-5da5-4d6b-86b1-b0a48223faa8', name: 'Fried Egg', price: 2500 },
          { id: '168ba853-23ce-4df4-bc4b-9ba78df26d60', name: 'Mushrooms', price: 2000 },
        ],
      },
    ],
  },
  {
    id: '4a93a436-3079-4cac-8175-da5dc4d88966',
    name: 'Thai Green Curry',
    price: 31000,
    original_price: null,
    ...img('1455619305-2337aef82d4b'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: 'db72f912-7ef8-4bfc-8f3a-787730a64041',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'da475355-1ec4-4843-a61c-d3a52dc8f09a', name: 'Garlic Mayo', price: 2000 },
          { id: '26742e2c-c4f1-41b3-ae6b-d6142e1f5d3c', name: 'Sweet Soy Sauce', price: 1000 },
        ],
      },
      {
        id: '7c730aa8-0777-4af0-867f-6a9e8036e8a2',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '5db6e7e6-8c2b-4eb6-a140-a56372285f69', name: 'Chicken', price: 5000 },
          { id: '2ea350b7-f76d-4adc-b1a5-38c3406c8f03', name: 'Tofu', price: 3000 },
        ],
      },
    ],
  },
  {
    id: 'f48a2ab0-1937-4e4e-8189-fe2ac2282e85',
    name: 'Sushi Platter',
    price: 14000,
    original_price: null,
    ...img('1485962568548-a4fe83f6aeac'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: 'ab92828f-7302-4135-9568-921cc9ec6c44',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '58e71b14-1f51-4795-84dc-c3cf4298ba0a', name: 'Pickles', price: 1000 },
          { id: 'e5f09332-456a-4845-85f4-a811cd4c1dc2', name: 'Fried Egg', price: 2500 },
          { id: 'cf2dae6b-a731-4eca-bac4-86f948c02b67', name: 'Extra Cheese', price: 3000 },
          { id: '80fadcba-484a-49c6-aa5a-81bd1e4b78f5', name: 'Avocado', price: 4000 },
        ],
      },
      {
        id: 'b3d536a0-2138-497e-b6c5-ad4c662d182a',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'bad03b65-c0b0-42ee-937a-8eb1d7ba2517', name: 'Kerupuk', price: 2000 },
          { id: '59cb024e-1235-4559-b4e7-627bbeb1d0a6', name: 'French Fries', price: 8000 },
          { id: 'bf814343-26d0-4172-91df-4fe5b478a2c1', name: 'Onion Rings', price: 6000 },
          { id: 'edde791d-6bfe-42dc-ae86-4fc78552f57d', name: 'Soup', price: 5000 },
        ],
      },
      {
        id: '38aa9cb1-1ef2-4dab-8050-2df64795e812',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '28f2cf2b-5141-4fa2-a52c-348e921cefc6', name: 'Mineral Water', price: 3000 },
          { id: 'a528a422-ffda-4cff-b392-093bb5bf695a', name: 'Orange Juice', price: 12000 },
          { id: '18d93eb3-6f79-422d-8f2c-0c09ac78c650', name: 'Iced Tea', price: 5000 },
        ],
      },
      {
        id: 'c88c4e54-a873-4063-91fc-4298a3dcc6ea',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'caa6f95b-6803-41e2-bb61-99bcfa8ec86e', name: 'Beef', price: 8000 },
          { id: '50465b1f-765b-4eaf-a18a-6df397da0e36', name: 'Seafood', price: 12000 },
          { id: 'cef0ad57-a0ed-4f02-9ebb-791e509d77b1', name: 'Chicken', price: 5000 },
        ],
      },
    ],
  },
  {
    id: '3e7d5b3b-5dce-4768-b754-f5180ce61d45',
    name: 'Crispy Fish Tacos',
    price: 19000,
    original_price: null,
    ...img('1559847844-5315695dadae'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: '844ed33f-1b01-4c14-ab4b-9eb3f2e78f87',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '71d6d581-0ce4-46c5-91c8-3e3abca717bc', name: 'Extra Cheese', price: 3000 },
          { id: 'bf4bc639-a35b-418f-a913-969a37cd7dcb', name: 'Pickles', price: 1000 },
          { id: 'cc9d6267-1a8e-4b73-93e8-2ad0bdef18bf', name: 'Fried Egg', price: 2500 },
          { id: '89523569-d4c4-42ba-acd2-64428f223aaa', name: 'Mushrooms', price: 2000 },
        ],
      },
      {
        id: '868865f9-fb59-497a-b73d-cd324a612783',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '33658ee4-51d9-41f2-a0b0-d8db06229a37', name: 'Iced Tea', price: 5000 },
          { id: '90e20f03-4d9e-4635-82c6-f912fed7082b', name: 'Orange Juice', price: 12000 },
        ],
      },
      {
        id: '4deb1717-c1a9-4354-bce6-2354014b3af1',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '261f973f-0945-4b13-b7a9-c82ad9427924', name: 'Onion Rings', price: 6000 },
          { id: '1ed51426-92f9-4639-8cb5-4a31546ea0b4', name: 'Soup', price: 5000 },
          { id: '05c85e32-0a08-4411-bbf1-8a90cc977136', name: 'French Fries', price: 8000 },
          { id: '8b279fe0-14ba-42fc-8c10-b164d7fd1b6c', name: 'Kerupuk', price: 2000 },
        ],
      },
      {
        id: '7d9130c7-cfa1-4ecd-8e28-0633f6b9492d',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'e78ab712-8b92-4e13-8788-70267899dd3d', name: 'Beef', price: 8000 },
          { id: 'ae7e2df0-3515-493d-b478-6271a06a9081', name: 'Chicken', price: 5000 },
        ],
      },
    ],
  },
  {
    id: 'f2a8b8f4-09be-49c1-83e1-f8ffb165cc04',
    name: 'Quinoa & Roasted Vegetable Salad',
    price: 52000,
    original_price: null,
    ...img('1547592166-23ac45744acd'),
    category_id: '044980b0-07f4-49c9-a4ce-9574d3274b2b',
    is_active: true,
    add_ons: [
      {
        id: 'b30d7746-b4f6-40b7-860b-e01eb10df820',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'c499e762-21e2-4d17-b825-98e713851a6e', name: 'Sweet Soy Sauce', price: 1000 },
          { id: 'f191d8a2-a6d7-4402-aaf1-9082cc46a7fa', name: 'Garlic Mayo', price: 2000 },
          { id: '1b6f1c34-fd05-4dfc-be5b-e895a4f91389', name: 'Chili Sauce', price: 1000 },
          { id: '1c008d2f-2e36-4215-ac2f-514c4f6cc839', name: 'BBQ Sauce', price: 1500 },
        ],
      },
      {
        id: 'ee29d8b4-6cad-4947-b681-8a46f666a174',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '468b8f8a-3525-4546-a42c-70f247e67196', name: 'French Fries', price: 8000 },
          { id: '5cd86d9d-72b4-4e6e-89df-b0ec4cbb9467', name: 'Onion Rings', price: 6000 },
          { id: 'e4ab8a44-1418-4314-863a-2d1f9b0d2f62', name: 'Kerupuk', price: 2000 },
          { id: '6fc18de4-6bf5-4b53-b940-162cc42d7c12', name: 'Soup', price: 5000 },
        ],
      },
    ],
  },
  {
    id: '6ece8c70-ca29-4dd8-a23c-f79257ee785c',
    name: 'Ramen with Soft-Boiled Egg',
    price: 73000,
    original_price: null,
    ...img('1569718130-73481e89e6e5'),
    category_id: '60540aff-5a98-48e9-ac3b-5ba6d324f44a',
    is_active: true,
    add_ons: [
      {
        id: '1c4fbe0d-c153-4761-b7c9-0f8b1aadee90',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '21219600-1ac6-41f9-bbbd-495b9571f077', name: 'Mild', price: 0 },
          { id: 'efd449f7-1b67-4265-9729-1a22b796c87c', name: 'Hot', price: 0 },
          { id: 'e8962a62-bc9b-4a33-817c-68065c3cb7e4', name: 'Extra Hot', price: 1000 },
        ],
      },
      {
        id: 'ce2763f7-7098-46de-944f-b4bcd64f59b4',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: 'd437061c-043e-43de-8883-fe36b439b3ea', name: 'Mushrooms', price: 2000 },
          { id: '38c58ee2-1852-466a-bc16-30d51aa1b2f7', name: 'Avocado', price: 4000 },
        ],
      },
    ],
  },
  {
    id: 'faf3183b-2c73-48d4-aae3-fdc7fea49f5f',
    name: 'Burrata & Heirloom Tomato Salad',
    price: 28000,
    original_price: null,
    ...img('1490645935967-10de6ba17061'),
    category_id: '317e588e-ddb2-478a-80fe-a082602dc7ab',
    is_active: true,
    add_ons: [
      {
        id: '456a03c5-da45-4504-8ab0-d97bce8826d1',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '95c16d27-7bcd-47df-9c25-87f8a0567632', name: 'Iced Tea', price: 5000 },
          { id: '961625f7-c28f-4f74-a67a-ce0bdc933d2e', name: 'Coffee', price: 8000 },
          { id: '8d1c92ea-fe00-4403-80ba-e862295e1dba', name: 'Mineral Water', price: 3000 },
        ],
      },
      {
        id: 'ed837ee3-9409-45ea-aa18-4e1ff7a45b8e',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'c6bf99ac-3d69-4b16-be25-ca0ad5fcc108', name: 'Chili Sauce', price: 1000 },
          { id: '94a42ecc-d90e-42b1-8ee0-84eebc09e8a7', name: 'BBQ Sauce', price: 1500 },
        ],
      },
      {
        id: '755abfc7-06ff-4e51-8fab-f15dcf817fcd',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '11275cf2-aa86-4968-a1e8-e2cbe09d4260', name: 'Mild', price: 0 },
          { id: '474b0d85-4906-4ff6-a184-40735d71003f', name: 'Extra Hot', price: 1000 },
          { id: 'b217850d-4aaa-4c1f-9896-c608997e8a5d', name: 'Hot', price: 0 },
          { id: 'af4952cd-d5b8-45fa-b485-a25338685251', name: 'Medium', price: 0 },
        ],
      },
    ],
  },
  {
    id: '188c7fd1-ab08-4ce0-9eeb-f9231ccc6a26',
    name: 'Seared Scallops with Lemon Butter',
    price: 5000,
    original_price: null,
    ...img('1565299624276-d1af92f1eb3b'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: 'ff1d1995-b4d3-47e8-b567-61a36042bd6c',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: 'c5217f5c-2b8b-47e6-a54f-26e75c72d9ee', name: 'Medium', price: 0 },
          { id: 'e4b8fcc0-241b-46c7-a9a8-7ce436088cea', name: 'Hot', price: 0 },
          { id: '71c7d83a-79d4-41ce-9257-0b8f0581ed86', name: 'Extra Hot', price: 1000 },
          { id: 'ba048edd-9781-401c-8153-d0f3dacd1537', name: 'Mild', price: 0 },
        ],
      },
      {
        id: '45d2ca9a-80e6-4d41-925a-82901217d651',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '53bf4645-8db0-41b9-95d2-622d500cc802', name: 'Garlic Mayo', price: 2000 },
          { id: 'aed4b750-eeec-40d5-9f9f-2fca5c42869b', name: 'Sweet Soy Sauce', price: 1000 },
        ],
      },
    ],
  },
  {
    id: '03c8851c-6966-4ea2-a9b2-79da11ec0aa9',
    name: 'Truffle Risotto',
    price: 0,
    original_price: 50000,
    ...img('1476224203421-9ac39bcb3b08'),
    category_id: 'c035eca3-03db-416b-846b-d6fe46640cd0',
    is_active: true,
    add_ons: [
      {
        id: '83f583f0-a4aa-49f9-925d-93175f40f520',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '1b996b5b-4bd8-4da4-b07f-044540338977', name: 'Hot', price: 0 },
          { id: '1c32f54c-136d-45a8-8a91-cebf621bddfa', name: 'Extra Hot', price: 1000 },
          { id: '04c035f5-283a-4a68-9aa9-6fa01d7a726d', name: 'Mild', price: 0 },
        ],
      },
      {
        id: '87947966-eda7-4e9e-b3b1-230572297af7',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'a4bf5940-0ce9-4d51-8353-e17ad7dc6f3a', name: 'Soup', price: 5000 },
          { id: '924d0f69-0174-4818-8736-c9c3310c5a50', name: 'Onion Rings', price: 6000 },
          { id: 'fe77fed2-8490-4f10-8656-48c5b4e1faa7', name: 'Kerupuk', price: 2000 },
          { id: '7c6d4d16-0844-4037-be90-6f6c294b0563', name: 'French Fries', price: 8000 },
        ],
      },
    ],
  },
  {
    id: 'b9dfa2a0-2cbc-4374-b034-8e72ee995b76',
    name: 'Spicy Tuna Roll',
    price: 94000,
    original_price: null,
    ...img('1558697376-1ed5f5e3e74d'),
    category_id: '60540aff-5a98-48e9-ac3b-5ba6d324f44a',
    is_active: true,
    add_ons: [
      {
        id: '5b87f144-172d-4280-b154-8748a1700cbb',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'cad0718e-71eb-45db-9edf-c877cd92fbfc', name: 'Garlic Mayo', price: 2000 },
          { id: 'ab4fba77-d3b1-40a7-b45e-7482d4700c83', name: 'Chili Sauce', price: 1000 },
        ],
      },
      {
        id: '44b3e3b1-841e-4214-8b12-1c80f60cea79',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'c8fec1b2-ac88-43bc-9ae0-97429a05044a', name: 'French Fries', price: 8000 },
          { id: 'a797391b-0ef4-4b9d-b6d0-fb31d4499ca1', name: 'Soup', price: 5000 },
          { id: 'fe34292b-459c-4258-b6b2-764a8067a26b', name: 'Onion Rings', price: 6000 },
        ],
      },
      {
        id: 'a9ab5490-bc78-40d2-8720-f23821f78809',
        name: 'Extra Toppings',
        min: 0, max: 3, required: false, multiple: true,
        options: [
          { id: '170274a5-8d68-4434-8f2b-a18be6a24d75', name: 'Onion Rings', price: 6000 },
          { id: 'ad814d57-b20b-4319-a3f3-16ee94b230bd', name: 'Mushrooms', price: 2000 },
          { id: '366a61f9-7ba2-4069-ac66-b8b692983488', name: 'Kerupuk', price: 2000 },
        ],
      },
    ],
  },
  {
    id: '15485c1b-a010-4e1d-879d-b17662b56eb7',
    name: 'Steak Frites with Garlic Butter',
    price: 93000,
    original_price: null,
    ...img('1544025132-083e4f642158'),
    category_id: '317e588e-ddb2-478a-80fe-a082602dc7ab',
    is_active: true,
    add_ons: [
      {
        id: '5bc3fbb9-c368-415b-8ac8-864c1c0fca85',
        name: 'Spice Level',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '6a2eefe2-1e41-4872-93bd-6eb2339e0186', name: 'Extra Hot', price: 1000 },
          { id: '38690d1e-ce25-4265-88f9-26cb80664ba5', name: 'Mild', price: 0 },
          { id: '1af1b58c-264b-44db-816b-e90761a68316', name: 'Medium', price: 0 },
        ],
      },
      {
        id: '44a68b96-5d12-475d-bbf0-8f8448c05a15',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '9ec5518d-963d-4aba-94a9-8af9b3eaa284', name: 'French Fries', price: 8000 },
          { id: '90771c6e-bc0d-41e6-97b1-02045ebc0336', name: 'Onion Rings', price: 6000 },
          { id: '0c9e1576-cce7-4562-8aae-ecf8e7deb638', name: 'Kerupuk', price: 2000 },
        ],
      },
      {
        id: '32310f26-103a-4e8e-b91c-282556d425ad',
        name: 'Drinks',
        min: 0, max: 1, required: false, multiple: false,
        options: [
          { id: '86e434a1-a509-4612-b35c-332f95d4610f', name: 'Coffee', price: 8000 },
          { id: 'dd38b47e-7a97-47f9-8e75-18d2edf4cdb2', name: 'Iced Tea', price: 5000 },
          { id: '1f51e1aa-e330-455b-bf00-a1ba24f5a4c5', name: 'Orange Juice', price: 12000 },
        ],
      },
    ],
  },
  {
    id: '084d6143-e501-463d-aaf4-c20b857c180f',
    name: 'Coconut Curry Lentil Soup',
    price: 86000,
    original_price: null,
    ...img('1603105060226-cf95e0a3de9d'),
    category_id: 'f8107eb4-a491-4ae2-915c-885dc76145e2',
    is_active: true,
    add_ons: [
      {
        id: 'e2113871-63a7-40b0-96c1-7e0e438352e2',
        name: 'Sides',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: 'b79b6b50-7bcf-4642-80c7-e935735960e8', name: 'Soup', price: 5000 },
          { id: '4548e47f-36d2-475f-b46a-925a76b7ddf7', name: 'French Fries', price: 8000 },
          { id: 'da472eb7-d408-4a98-aa7c-4b8fdbb05030', name: 'Kerupuk', price: 2000 },
          { id: '0f4b2b61-c78b-431b-b194-82083b3b8a31', name: 'Onion Rings', price: 6000 },
        ],
      },
      {
        id: '10cc1067-6fa2-487b-a385-c098df57e722',
        name: 'Extra Sauce',
        min: 0, max: 2, required: false, multiple: true,
        options: [
          { id: '0634ceef-0687-4392-860d-9770bd882a42', name: 'Sweet Soy Sauce', price: 1000 },
          { id: '455cc55a-724d-4536-8552-4f5870ef263c', name: 'Chili Sauce', price: 1000 },
        ],
      },
      {
        id: 'c5d91bad-c89b-4ac6-b522-26ee3603ccc0',
        name: 'Protein',
        min: 1, max: 1, required: true, multiple: false,
        options: [
          { id: '88817aa7-d067-4afe-9813-b6a72ca4f715', name: 'Chicken', price: 5000 },
          { id: '76dc9264-d486-42ba-8975-98f200a91997', name: 'Tofu', price: 3000 },
        ],
      },
    ],
  },
  {
    id: '5386cee4-ac9c-4fc4-a23c-26cd36382a26',
    name: 'Nasi Goreng Spesial',
    price: 50000,
    original_price: null,
    ...img('1563245581-d98a91dbd5a1'),
    category_id: '858d5448-1806-4bf8-88bf-43f37570ab2b',
    is_active: true,
    add_ons: [],
  },
];

export const MOCK_CATEGORIES: POSCategory[] = [
  { id: '60540aff-5a98-48e9-ac3b-5ba6d324f44a', name: 'Dinner' },
  { id: '044980b0-07f4-49c9-a4ce-9574d3274b2b', name: 'Vegetarian' },
  { id: 'c035eca3-03db-416b-846b-d6fe46640cd0', name: 'Appetizers' },
  { id: '317e588e-ddb2-478a-80fe-a082602dc7ab', name: 'Soups' },
  { id: 'f8107eb4-a491-4ae2-915c-885dc76145e2', name: 'Grill' },
  { id: '858d5448-1806-4bf8-88bf-43f37570ab2b', name: 'Makanan Utama' },
];

export const MOCK_TABLES: POSTable[] = [
  { id: 'tbl-1', name: 'Meja 1', area_id: 'area-1', area_name: 'Indoor', pax: 4 },
  { id: 'tbl-2', name: 'Meja 2', area_id: 'area-1', area_name: 'Indoor', pax: 4 },
  { id: 'tbl-3', name: 'Meja 3', area_id: 'area-1', area_name: 'Indoor', pax: 2 },
  { id: 'tbl-4', name: 'Meja 4', area_id: 'area-2', area_name: 'Outdoor', pax: 6 },
  { id: 'tbl-5', name: 'Meja 5', area_id: 'area-2', area_name: 'Outdoor', pax: 4 },
  { id: 'tbl-6', name: 'VIP 1', area_id: 'area-3', area_name: 'VIP', pax: 8 },
];
