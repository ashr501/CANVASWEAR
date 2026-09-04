export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    handle
    tags
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    variants(first: 1) {
      nodes {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

export const HOME_PRODUCTS_QUERY = `#graphql
  query HomeProducts(
    $country: CountryCode
    $language: LanguageCode
    $featuredHandle: String!
    $newArrivalsHandle: String!
  ) @inContext(country: $country, language: $language) {
    featured: collection(handle: $featuredHandle) {
      id
      title
      handle
      products(first: 6) {
        nodes {
          ...ProductCard
        }
      }
    }
    newArrivals: collection(handle: $newArrivalsHandle) {
      id
      title
      handle
      products(first: 4) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const PRODUCTS_QUERY = `#graphql
  query Products(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
      query: $query
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
      media(first: 20) {
        nodes {
          __typename
          ... on Video {
            id
            alt
            previewImage {
              url
            }
            sources {
              url
              format
            }
          }
        }
      }
      options {
        name
        values
      }
      selectedVariant: variantBySelectedOptions(
        selectedOptions: $selectedOptions
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        id
        sku
        availableForSale
        quantityAvailable
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        image {
          url
          altText
          width
          height
        }
      }
      variants(first: 100) {
        nodes {
          id
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

export const RELATED_PRODUCTS_QUERY = `#graphql
  query RelatedProducts(
    $country: CountryCode
    $language: LanguageCode
    $searchQuery: String!
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $searchQuery) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $searchQuery: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $searchQuery
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const VIDEO_PRODUCTS_QUERY = `#graphql
  query VideoProducts(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first, after: $after) {
        nodes {
          id
          title
          handle
          media(first: 30) {
            nodes {
              __typename
              ... on Video {
                id
                alt
                previewImage {
                  url
                }
                sources {
                  url
                  format
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const CART_QUERY = `#graphql
  query CartQuery($cartId: ID!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      buyerIdentity {
        countryCode
        customer {
          id
          email
          firstName
          lastName
        }
      }
      lines(first: 100) {
        nodes {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              title
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              product {
                handle
                title
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
        totalDutyAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      note
      attributes {
        key
        value
      }
      discountCodes {
        code
        applicable
      }
    }
  }
`;

/** トップページ用。動画を持つ商品を優先して並べたいので、カード表示に必要な情報に
 *  加えて「動画があるか」だけを取る。sourcesまで取ると重いのでVideoのidだけ見る。 */
export const CATEGORY_PRODUCTS_QUERY = `#graphql
  query CategoryProducts(
    $handle: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          ...ProductCard
          media(first: 30) {
            nodes {
              __typename
            }
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

/** トップページで動画つき商品を先に見せるための検索。
 *  コレクションから60件取って絞る方式だと、動画つきは全体の2割弱なので
 *  先頭に1件も入らないことがある。「動画あり」タグで直接引く。 */
export const VIDEO_TAGGED_PRODUCTS_QUERY = `#graphql
  query VideoTaggedProducts(
    $query: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
