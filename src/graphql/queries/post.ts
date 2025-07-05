import { gql } from '@apollo/client'

export const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String, $filter: PostFilterInput, $orderBy: PostOrderBy) {
    posts(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
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
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
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
      viewCount
      empathyCount
      createdAt
      updatedAt
      user {
        id
        displayName
        profileImageUrl
        bio
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
      empathies {
        id
        empathyType
        user {
          id
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
      moodTag
      createdAt
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
      moodTag
      updatedAt
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
      type
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
