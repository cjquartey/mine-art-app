#!/usr/bin/env python3
"""
First part of generating line art from images
Building from "Learning to Generate Line Drawings" (Chan et al., 2022).
"""

import os
import time
import json
from pathlib import Path

import torch
import torchvision.transforms as transforms
from PIL import Image

from model import Generator


class LineArtGenerator:
    """Generates line art from photos using pre-trained models."""
    
    def __init__(self, models_dir='../models'):
        """
        Initialiser for LineArtGenerator object that loads the pre-trained models when instantiated.

        Args:
            models_dir: Path to directory containing model folders (default: '../models')
        """

        self.models_dir = Path(models_dir)

        # Decide which processing chip to use (NVIDIA, Apple MPS or CPU)
        if torch.cuda.is_available():
            self.device = torch.device('cuda')
        elif torch.backends.mps.is_available():
            self.device = torch.device('mps')
        else:
            self.device = torch.device('cpu')
            
        self.models = {} # dict to store loaded models for reuse
        
        # Models and their configurations
        self.styles = {
            'contour': {
                'path': self.models_dir / 'contour_style' / 'netG_A_latest.pth',
                'input_nc': 3, # 3 channels for RGB input
                'output_nc': 1, # 1 channel for grayscale line art output
                'n_blocks': 3 # number of ResNet residual blocks in the midle of the generator architecture, as per the original paper (Chan et al., 2022)
            },
            'anime': {
                'path': self.models_dir / 'anime_style' / 'netG_A_latest.pth',
                'input_nc': 3,
                'output_nc': 1,
                'n_blocks': 3
            }
        }
        
        # Image preprocessing (resize to 256x256 and convert to tensor)
        self.transform = transforms.Compose([
            transforms.Resize(256, Image.BICUBIC),
            transforms.ToTensor()
        ])
    
    def load_model(self, style):
        """
        Load a Generator model for the specified style.
        
        Args:
            style: 'contour' or 'anime' (text string)
            
        Returns:
            Loaded model ready to generate line art from photos.
            
        Raises:
            ValueError: If style is invalid
            FileNotFoundError: If model file doesn't exist
        """

        # check is the style is valid/exists in the styles dict
        if style not in self.styles:
            raise ValueError(f"Invalid style '{style}'. Choose 'contour' or 'anime'.")
        
        # If the model is already loaded, return it from the cache (reuse)
        if style in self.models:
            return self.models[style]
        
        # get the configuration for this particular style
        config = self.styles[style]
        model_path = config['path']
        
        # Check if the model file exists before trying to load it
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        # Create and load model
        model = Generator(
            input_nc=config['input_nc'],
            output_nc=config['output_nc'],
            n_residual_blocks=config['n_blocks']
        )
        
        # Load the pre-trained weights into the model
        state_dict = torch.load(model_path, map_location='cpu') # Load to CPU first to avoid "not available for CUDA" errors
        model.load_state_dict(state_dict) # put weight into model architecture

        model.to(self.device) # move model to the selected device
        model.eval() # set model to evaluation mode
        
        # Store/cache the loaded model so we don't have to load it again later
        self.models[style] = model
        
        return model
    
    def generate(self, input_path, output_path, style='contour'):
        """
        Generate line art from a photo.
        
        Args:
            input_path: Path to input photo
            output_path: Path to save output line art PNG
            style: 'contour' or 'anime'
            
        Returns:
            dictionary with:
                success (bool): Whether generation succeeded
                output_path (str): Path to generated image
                processing_time (float): Time taken in seconds
                error (str): Error message if failed
        """
        start_time = time.time() # start timer

        # Initialize result dictionary with default values
        result = {
            'success': False,
            'output_path': None,
            'processing_time': 0.0,
            'error': None
        }
        
        try:
            # Load input image and check if it exists
            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Input image not found: {input_path}")
            
            image = Image.open(input_path).convert('RGB')
            
            # Load model
            model = self.load_model(style)
            
            # specifies batch size of 1, and moves the input tensor to device
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Generate line art
            with torch.no_grad():
                output_tensor = model(input_tensor)
            
            # Convert to PIL Image
            output_image = transforms.ToPILImage()(output_tensor.squeeze(0).cpu())
            
            # Save
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            output_image.save(output_path)
            
            # Success
            result['success'] = True
            result['output_path'] = output_path
            result['processing_time'] = time.time() - start_time
            
        except Exception as e:
            result['error'] = str(e)
            result['processing_time'] = time.time() - start_time
        
        return result


def main():
    """CLI program for testing."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate line art from photos'
    )
    parser.add_argument(
        'input',
        help='Path to input photo'
    )
    parser.add_argument(
        'output',
        help='Path to save line art PNG'
    )
    parser.add_argument(
        '--style',
        choices=['contour', 'anime'],
        default='contour',
        help='Line art style (default: contour)'
    )
    parser.add_argument(
        '--models-dir',
        default='../models',
        help='Path to models directory'
    )
    
    args = parser.parse_args()
    
    # Generate
    generator = LineArtGenerator(models_dir=args.models_dir)
    result = generator.generate(args.input, args.output, style=args.style)
    
    # Print result
    print(json.dumps(result, indent=2))
    
    # Exit code: 0 = success, 1 = failure
    if result['success']:
        return 0
    else:
        return 1

if __name__ == '__main__':
    exit(main())