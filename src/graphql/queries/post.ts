import { gql } from '@apollo/client'

export const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String, $filter: PostFilterInput, $orderBy: PostOrderBy) {
    posts(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          id
          title
          content
          cosmeticName
          cosmeticCategory
          skinType
          moodTag
          viewCount
          empathyCount
          createdAt
          user {
            id
            displayName
            profileImageUrl
          }
          empathies {
            id
            empathyType
            user {
              id
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`

export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      cosmeticName
      cosmeticCategory
      skinType
      usageSituation
      experienceDetails
      moodTag
      createdAt
      viewCount
      empathyCount
      user {
        id
        displayName
        profileImageUrl
        bio
      }
      empathies {
        id
        empathyType
        user {
          id
        }
      }
      comments {
        id
        content
        createdAt
        user {
          id
          displayName
          profileImageUrl
        }
      }
    }
  }
`

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      cosmeticName
      cosmeticCategory
      skinType
      usageSituation
      experienceDetails
      moodTag
      createdAt
      viewCount
      empathyCount
      user {
        id
        displayName
      }
    }
  }
`

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      content
      cosmeticName
      cosmeticCategory
      skinType
      usageSituation
      experienceDetails
      moodTag
      createdAt
      viewCount
      empathyCount
      user {
        id
        displayName
      }
    }
  }
`

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`

export const ADD_EMPATHY = gql`
  mutation AddEmpathy($postId: ID!, $type: String!) {
    addEmpathy(postId: $postId, type: $type) {
      id
      empathyType
      post {
        id
        empathyCount
      }
      user {
        id
      }
    }
  }
`

export const REMOVE_EMPATHY = gql`
  mutation RemoveEmpathy($postId: ID!) {
    removeEmpathy(postId: $postId)
  }
`

export const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $content: String!) {
    addComment(postId: $postId, content: $content) {
      id
      content
      createdAt
      user {
        id
        displayName
        profileImageUrl
      }
    }
  }
`
