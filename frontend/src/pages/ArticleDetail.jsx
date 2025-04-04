import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

function ArticleDetail() {
  const [articleData, setArticleData] = useState(null);
  const [collection, setCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { collectionId, articleSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (collectionId && articleSlug) {
      fetchArticle();
    }
  }, [collectionId, articleSlug]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const collectionResponse = await api.get(
        `/blogs/${collectionId}/${articleSlug}`
      );
      if (!collectionResponse.data)
        throw new Error("Blog collection not found");

      const blogCollection = collectionResponse.data;
      setCollection(blogCollection);
      setArticleData(blogCollection.article);
    } catch (err) {
      console.error("Error fetching article:", err);
      setError("This article could not be found.");
    } finally {
      setIsLoading(false);
    }
  };

  return <div>{/* Article rendering logic */}</div>;
}

export default ArticleDetail;
