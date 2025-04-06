
import React from 'react';
import { Github, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContactUs = () => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 py-8 rounded-lg shadow-sm">
      <div className="container px-4 mx-auto">
        <h2 className="text-xl font-semibold text-center mb-6 text-indigo-800">Connect With Us</h2>
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-purple-300 hover:bg-purple-100 hover:text-purple-800 transition-all"
            onClick={() => window.open('https://github.com/SNR9', '_blank')}
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800 transition-all"
            onClick={() => window.open('mailto:syednaseer91820@gmail.com', '_blank')}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-pink-300 hover:bg-pink-100 hover:text-pink-800 transition-all"
            onClick={() => window.open('https://snr9.github.io/syednaseer.github.io/', '_blank')}
          >
            <Globe className="h-4 w-4" />
            <span>Portfolio</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
