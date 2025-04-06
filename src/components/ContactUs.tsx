
import React from 'react';
import { Github, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContactUs = () => {
  return (
    <div className="bg-gray-100 py-6 rounded-lg">
      <div className="container px-4 mx-auto">
        <h2 className="text-xl font-semibold text-center mb-4">Contact Us</h2>
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open('https://github.com/SNR9', '_blank')}
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open('mailto:syednaseer91820@gmail.com', '_blank')}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
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
