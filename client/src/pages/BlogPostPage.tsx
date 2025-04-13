import React from 'react';
import BlogPost from '@/components/BlogPost';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const BlogPostPage: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <BlogPost />
      </main>
      <Footer />
    </>
  );
};

export default BlogPostPage;